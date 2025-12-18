const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/index')

const router = express.Router()

router.use(authenticateToken)

// Get full profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT 
        id, name, email, phone, date_of_birth, tax_code,
        address_line1, address_line2, city, postal_code, country,
        iban, bank_name,
        notifications, location,
        two_factor_enabled,
        created_at
      FROM users WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' })
    }

    res.json({
      success: true,
      profile: result.rows[0]
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero del profilo' })
  }
})

// Update profile - COMPLETE
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id
    const {
      name, phone, dateOfBirth, taxCode,
      addressLine1, addressLine2, city, postalCode, country,
      iban, bankName,
      notifications, location
    } = req.body

    const updates = []
    const values = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`)
      values.push(phone)
    }
    if (dateOfBirth !== undefined) {
      updates.push(`date_of_birth = $${paramCount++}`)
      values.push(dateOfBirth)
    }
    if (taxCode !== undefined) {
      updates.push(`tax_code = $${paramCount++}`)
      values.push(taxCode)
    }
    if (addressLine1 !== undefined) {
      updates.push(`address_line1 = $${paramCount++}`)
      values.push(addressLine1)
    }
    if (addressLine2 !== undefined) {
      updates.push(`address_line2 = $${paramCount++}`)
      values.push(addressLine2)
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`)
      values.push(city)
    }
    if (postalCode !== undefined) {
      updates.push(`postal_code = $${paramCount++}`)
      values.push(postalCode)
    }
    if (country !== undefined) {
      updates.push(`country = $${paramCount++}`)
      values.push(country)
    }
    if (iban !== undefined) {
      updates.push(`iban = $${paramCount++}`)
      values.push(iban)
    }
    if (bankName !== undefined) {
      updates.push(`bank_name = $${paramCount++}`)
      values.push(bankName)
    }
    if (notifications !== undefined) {
      updates.push(`notifications = $${paramCount++}`)
      values.push(notifications)
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`)
      values.push(location)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nessun campo da aggiornare' })
    }

    values.push(userId)

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, phone, date_of_birth, tax_code,
                  address_line1, address_line2, city, postal_code, country,
                  iban, bank_name, notifications, location`,
      values
    )

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      user: result.rows[0],
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del profilo' })
  }
})

// Complete onboarding
router.post('/onboarding', async (req, res) => {
  try {
    const userId = req.user.id
    const { location, notifications } = req.body

    const updates = []
    const values = []
    let paramCount = 1

    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`)
      values.push(location)
    }
    if (notifications !== undefined) {
      updates.push(`notifications = $${paramCount++}`)
      values.push(notifications)
    }

    if (updates.length > 0) {
      values.push(userId)
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      )
    }

    res.json({ message: 'Onboarding completato con successo' })
  } catch (error) {
    console.error('Onboarding error:', error)
    res.status(500).json({ message: 'Errore nel completamento dell\'onboarding' })
  }
})

module.exports = router

