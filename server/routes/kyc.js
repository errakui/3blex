const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pool = require('../db/index')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { processPendingCommissionsOnKycApproval } = require('../utils/commissionWallet')

// Configurazione multer per upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/kyc')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const userId = req.user.id
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    const filename = `${userId}_${file.fieldname}_${timestamp}${ext}`
    cb(null, filename)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Formato file non valido. Solo JPEG, PNG, PDF'))
  }
})

// ============================================
// UPLOAD KYC DOCUMENTS (Documento, Selfie, Proof of Address)
// ============================================
router.post('/upload', authenticateToken, upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.id
    const { documentType, documentNumber, documentExpiry, addressDocumentType } = req.body

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: 'Nessun file caricato' })
    }

    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // Verifica documenti esistenti
      const existingDocs = await client.query(
        'SELECT type FROM kyc_documents WHERE user_id = $1',
        [userId]
      )
      const existingTypes = existingDocs.rows.map(r => r.type)

      // Upload documento identità
      if (req.files.document && req.files.document[0]) {
        const docFile = req.files.document[0]
        const filePath = `/uploads/kyc/${docFile.filename}`

        if (existingTypes.includes('document')) {
          await client.query(
            `UPDATE kyc_documents 
             SET file_path = $1, document_type = $2, document_number = $3, document_expiry = $4, status = 'pending'
             WHERE user_id = $5 AND type = 'document'`,
            [filePath, documentType, documentNumber, documentExpiry || null, userId]
          )
        } else {
          await client.query(
            `INSERT INTO kyc_documents 
             (user_id, type, file_path, document_type, document_number, document_expiry, status) 
             VALUES ($1, 'document', $2, $3, $4, $5, 'pending')`,
            [userId, filePath, documentType, documentNumber, documentExpiry || null]
          )
        }
      }

      // Upload selfie
      if (req.files.selfie && req.files.selfie[0]) {
        const selfieFile = req.files.selfie[0]
        const filePath = `/uploads/kyc/${selfieFile.filename}`

        if (existingTypes.includes('selfie')) {
          await client.query(
            `UPDATE kyc_documents 
             SET file_path = $1, selfie_path = $2, status = 'pending'
             WHERE user_id = $3 AND type = 'selfie'`,
            [filePath, filePath, userId]
          )
        } else {
          // Aggiorna anche il documento principale con selfie_path
          await client.query(
            `UPDATE kyc_documents 
             SET selfie_path = $1
             WHERE user_id = $2 AND type = 'document'`,
            [filePath, userId]
          )

          await client.query(
            `INSERT INTO kyc_documents 
             (user_id, type, file_path, selfie_path, status) 
             VALUES ($1, 'selfie', $2, $2, 'pending')`,
            [userId, filePath]
          )
        }
      }

      // Upload proof of address
      if (req.files.proofOfAddress && req.files.proofOfAddress[0]) {
        const poaFile = req.files.proofOfAddress[0]
        const filePath = `/uploads/kyc/${poaFile.filename}`

        if (existingTypes.includes('proof_of_address')) {
          await client.query(
            `UPDATE kyc_documents 
             SET file_path = $1, proof_of_address_path = $2, address_document_type = $3, status = 'pending'
             WHERE user_id = $4 AND type = 'proof_of_address'`,
            [filePath, filePath, addressDocumentType, userId]
          )
        } else {
          // Aggiorna anche il documento principale con proof_of_address_path
          await client.query(
            `UPDATE kyc_documents 
             SET proof_of_address_path = $1, address_document_type = $2
             WHERE user_id = $3 AND type = 'document'`,
            [filePath, addressDocumentType, userId]
          )

          await client.query(
            `INSERT INTO kyc_documents 
             (user_id, type, file_path, proof_of_address_path, address_document_type, status) 
             VALUES ($1, 'proof_of_address', $2, $2, $3, 'pending')`,
            [userId, filePath, addressDocumentType]
          )
        }
      }

      // Aggiorna stato KYC utente
      await client.query(
        `UPDATE users SET kyc_status = 'in_review' WHERE id = $1`,
        [userId]
      )

      await client.query('COMMIT')

      // Notifica
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type) 
        VALUES ($1, 'KYC In Verifica', 'I tuoi documenti KYC sono stati caricati e sono in fase di verifica.', 'info')`,
        [userId]
      )

      res.json({
        success: true,
        message: 'Documenti KYC caricati con successo. In attesa di verifica.',
        status: 'in_review'
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error uploading KYC documents:', error)
    res.status(500).json({ success: false, message: 'Errore nel caricamento dei documenti: ' + error.message })
  }
})

// ============================================
// GET KYC STATUS
// ============================================
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const userResult = await pool.query(
      'SELECT kyc_status FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' })
    }

    const docsResult = await pool.query(
      `SELECT type, status, file_path, document_type, document_number, 
              selfie_path, proof_of_address_path, address_document_type,
              rejection_reason, reviewed_at
       FROM kyc_documents 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    )

    const documents = {}
    docsResult.rows.forEach(doc => {
      documents[doc.type] = {
        status: doc.status,
        filePath: doc.file_path,
        documentType: doc.document_type,
        documentNumber: doc.document_number,
        selfiePath: doc.selfie_path,
        proofOfAddressPath: doc.proof_of_address_path,
        addressDocumentType: doc.address_document_type,
        rejectionReason: doc.rejection_reason,
        reviewedAt: doc.reviewed_at
      }
    })

    res.json({
      success: true,
      kycStatus: userResult.rows[0].kyc_status,
      documents
    })

  } catch (error) {
    console.error('Error fetching KYC status:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dello stato KYC' })
  }
})

// ============================================
// ADMIN: APPROVE/REJECT KYC
// ============================================
router.post('/review/:userId', authenticateToken, async (req, res) => {
  try {
    // Verifica admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accesso negato' })
    }

    const { userId } = req.params
    const { action, rejectionReason } = req.body // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Azione non valida' })
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      const kycStatus = action === 'approve' ? 'approved' : 'rejected'

      // Aggiorna tutti i documenti KYC
      await client.query(
        `UPDATE kyc_documents 
         SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3
         WHERE user_id = $4`,
        [newStatus, req.user.id, action === 'reject' ? rejectionReason : null, userId]
      )

      // Aggiorna stato KYC utente
      await client.query(
        `UPDATE users SET kyc_status = $1 WHERE id = $2`,
        [kycStatus, userId]
      )

      // Se approvato, processa commissioni in pending
      if (action === 'approve') {
        try {
          await processPendingCommissionsOnKycApproval(userId)
        } catch (error) {
          console.error('Error processing pending commissions:', error)
          // Non fallire l'approvazione KYC se c'è errore nelle commissioni
        }
      }

      await client.query('COMMIT')

      // Notifica utente
      const message = action === 'approve' 
        ? 'La tua verifica KYC è stata approvata! Ora puoi prelevare le commissioni.'
        : `La tua verifica KYC è stata rifiutata. Motivo: ${rejectionReason || 'Non specificato'}`

      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type) 
        VALUES ($1, $2, $3, $4)`,
        [userId, `KYC ${action === 'approve' ? 'Approvato' : 'Rifiutato'}`, message, action === 'approve' ? 'success' : 'error']
      )

      res.json({
        success: true,
        message: `KYC ${action === 'approve' ? 'approvato' : 'rifiutato'} con successo`
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error reviewing KYC:', error)
    res.status(500).json({ success: false, message: 'Errore nella revisione KYC: ' + error.message })
  }
})

// ============================================
// ADMIN: GET ALL KYC PENDING
// ============================================
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accesso negato' })
    }

    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.kyc_status,
        kd.type, kd.status, kd.file_path, kd.document_type, kd.document_number,
        kd.selfie_path, kd.proof_of_address_path, kd.address_document_type,
        kd.created_at, kd.reviewed_at
      FROM users u
      LEFT JOIN kyc_documents kd ON u.id = kd.user_id
      WHERE u.kyc_status IN ('pending', 'in_review')
      ORDER BY kd.created_at DESC`
    )

    // Raggruppa per utente
    const usersMap = {}
    result.rows.forEach(row => {
      if (!usersMap[row.id]) {
        usersMap[row.id] = {
          id: row.id,
          name: row.name,
          email: row.email,
          kycStatus: row.kyc_status,
          documents: {}
        }
      }
      if (row.type) {
        usersMap[row.id].documents[row.type] = {
          status: row.status,
          filePath: row.file_path,
          documentType: row.document_type,
          documentNumber: row.document_number,
          selfiePath: row.selfie_path,
          proofOfAddressPath: row.proof_of_address_path,
          addressDocumentType: row.address_document_type,
          createdAt: row.created_at,
          reviewedAt: row.reviewed_at
        }
      }
    })

    res.json({
      success: true,
      pending: Object.values(usersMap)
    })

  } catch (error) {
    console.error('Error fetching pending KYC:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei KYC in attesa' })
  }
})

module.exports = router
