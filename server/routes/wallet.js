const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken } = require('../middleware/auth')

// ============================================
// GET WALLET BALANCE & INFO
// ============================================
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT 
        wallet_balance,
        (SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1) as total_transactions,
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE user_id = $1 AND status IN ('pending', 'processing')) as pending_withdrawals
      FROM users WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' })
    }

    res.json({
      success: true,
      balance: parseFloat(result.rows[0].wallet_balance) || 0,
      totalTransactions: parseInt(result.rows[0].total_transactions) || 0,
      pendingWithdrawals: parseFloat(result.rows[0].pending_withdrawals) || 0,
      availableBalance: parseFloat(result.rows[0].wallet_balance) - (parseFloat(result.rows[0].pending_withdrawals) || 0)
    })
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero del saldo' })
  }
})

// ============================================
// GET TRANSACTION HISTORY
// ============================================
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20, type } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        wt.*,
        CASE 
          WHEN wt.reference_type = 'commission' THEN (SELECT amount FROM commissions WHERE id = wt.reference_id)
          WHEN wt.reference_type = 'order' THEN (SELECT total FROM orders WHERE id = wt.reference_id)
          ELSE NULL
        END as reference_details
      FROM wallet_transactions wt
      WHERE wt.user_id = $1
    `
    const params = [userId]
    let paramIndex = 2

    if (type) {
      query += ` AND wt.type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    query += ` ORDER BY wt.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Count total
    let countQuery = 'SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1'
    const countParams = [userId]
    if (type) {
      countQuery += ' AND type = $2'
      countParams.push(type)
    }
    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count)

    res.json({
      success: true,
      transactions: result.rows.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        balanceBefore: parseFloat(tx.balance_before),
        balanceAfter: parseFloat(tx.balance_after),
        status: tx.status,
        description: tx.description,
        referenceId: tx.reference_id,
        referenceType: tx.reference_type,
        processedAt: tx.processed_at,
        createdAt: tx.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero delle transazioni' })
  }
})

// ============================================
// CREATE WITHDRAWAL REQUEST
// ============================================
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { amount, withdrawalMethod, bankDetails } = req.body

    // Validazione
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Importo non valido' })
    }

    if (!withdrawalMethod || !['bank_transfer', 'card'].includes(withdrawalMethod)) {
      return res.status(400).json({ success: false, message: 'Metodo di prelievo non valido' })
    }

    // Verifica KYC
    const userResult = await pool.query(
      'SELECT kyc_status, wallet_balance FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' })
    }

    const user = userResult.rows[0]

    if (user.kyc_status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'KYC non approvato. Completa la verifica KYC prima di prelevare.',
        requiresKyc: true
      })
    }

    // Verifica saldo disponibile
    const currentBalance = parseFloat(user.wallet_balance) || 0
    const withdrawalAmount = parseFloat(amount)
    const fee = withdrawalMethod === 'bank_transfer' ? 2.0 : 5.0 // Fee configurabili
    const totalDeduction = withdrawalAmount + fee

    if (currentBalance < totalDeduction) {
      return res.status(400).json({ 
        success: false, 
        message: `Saldo insufficiente. Disponibile: €${currentBalance.toFixed(2)}, Richiesto: €${totalDeduction.toFixed(2)}` 
      })
    }

    // Verifica prelievi pendenti
    const pendingResult = await pool.query(
      'SELECT COALESCE(SUM(amount + fee), 0) as pending FROM withdrawals WHERE user_id = $1 AND status IN ($2, $3)',
      [userId, 'pending', 'processing']
    )
    const pendingAmount = parseFloat(pendingResult.rows[0].pending) || 0

    if (currentBalance < totalDeduction + pendingAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Saldo non disponibile. Hai prelievi in elaborazione di €${pendingAmount.toFixed(2)}` 
      })
    }

    // Crea richiesta prelievo
    const netAmount = withdrawalAmount - fee

    const withdrawalResult = await pool.query(
      `INSERT INTO withdrawals 
        (user_id, amount, withdrawal_method, bank_details, status, fee, net_amount) 
      VALUES ($1, $2, $3, $4, 'pending', $5, $6) 
      RETURNING id, amount, fee, net_amount, status, created_at`,
      [userId, withdrawalAmount, withdrawalMethod, JSON.stringify(bankDetails || {}), fee, netAmount]
    )

    // Aggiorna saldo wallet (blocca i fondi)
    await pool.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [totalDeduction, userId]
    )

    // Crea transazione wallet
    const newBalance = currentBalance - totalDeduction
    await pool.query(
      `INSERT INTO wallet_transactions 
        (user_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id) 
      VALUES ($1, 'withdrawal', $2, $3, $4, 'pending', 'Richiesta prelievo', 'withdrawal', $5)`,
      [userId, -totalDeduction, currentBalance, newBalance, withdrawalResult.rows[0].id]
    )

    // Notifica
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) 
      VALUES ($1, 'Richiesta Prelievo', $2, 'info')`,
      [userId, `Hai richiesto un prelievo di €${withdrawalAmount.toFixed(2)}. L'elaborazione richiederà 3-5 giorni lavorativi.`]
    )

    res.json({
      success: true,
      message: 'Richiesta di prelievo creata con successo',
      withdrawal: {
        id: withdrawalResult.rows[0].id,
        amount: parseFloat(withdrawalResult.rows[0].amount),
        fee: parseFloat(withdrawalResult.rows[0].fee),
        netAmount: parseFloat(withdrawalResult.rows[0].net_amount),
        status: withdrawalResult.rows[0].status,
        createdAt: withdrawalResult.rows[0].created_at
      },
      newBalance
    })
  } catch (error) {
    console.error('Error creating withdrawal:', error)
    res.status(500).json({ success: false, message: 'Errore nella richiesta di prelievo' })
  }
})

// ============================================
// GET WITHDRAWAL HISTORY
// ============================================
router.get('/withdrawals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20, status } = req.query
    const offset = (page - 1) * limit

    let query = 'SELECT * FROM withdrawals WHERE user_id = $1'
    const params = [userId]
    let paramIndex = 2

    if (status) {
      query += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Count total
    let countQuery = 'SELECT COUNT(*) FROM withdrawals WHERE user_id = $1'
    const countParams = [userId]
    if (status) {
      countQuery += ' AND status = $2'
      countParams.push(status)
    }
    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count)

    res.json({
      success: true,
      withdrawals: result.rows.map(w => ({
        id: w.id,
        amount: parseFloat(w.amount),
        fee: parseFloat(w.fee),
        netAmount: parseFloat(w.net_amount),
        method: w.withdrawal_method,
        bankDetails: w.bank_details,
        status: w.status,
        rejectionReason: w.rejection_reason,
        processedAt: w.processed_at,
        createdAt: w.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei prelievi' })
  }
})

module.exports = router

