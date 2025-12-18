const pool = require('../db/index')

/**
 * Aggiorna lo stato della commissione e accredita al wallet quando disponibile
 */
async function processCommissionToWallet(commissionId, referrerId, amount) {
  try {
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // Verifica KYC del referrer
      const userResult = await client.query(
        'SELECT kyc_status, wallet_balance FROM users WHERE id = $1',
        [referrerId]
      )

      if (userResult.rows.length === 0) {
        throw new Error('Utente non trovato')
      }

      const user = userResult.rows[0]

      // Se KYC approvato, accredita direttamente al wallet
      if (user.kyc_status === 'approved') {
        // Aggiorna commissione a "available"
        await client.query(
          'UPDATE commissions SET status = $1 WHERE id = $2',
          ['available', commissionId]
        )

        // Accreditare al wallet
        const currentBalance = parseFloat(user.wallet_balance) || 0
        const newBalance = currentBalance + parseFloat(amount)

        await client.query(
          'UPDATE users SET wallet_balance = $1 WHERE id = $2',
          [newBalance, referrerId]
        )

        // Crea transazione wallet
        await client.query(
          `INSERT INTO wallet_transactions 
            (user_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id, processed_at) 
          VALUES ($1, 'commission', $2, $3, $4, 'completed', $5, 'commission', $6, NOW())`,
          [
            referrerId,
            amount,
            currentBalance,
            newBalance,
            `Commissione guadagnata: €${parseFloat(amount).toFixed(2)}`,
            commissionId
          ]
        )

        // Notifica
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type) 
          VALUES ($1, 'Commissione Accreditata', $2, 'success')`,
          [
            referrerId,
            `€${parseFloat(amount).toFixed(2)} sono stati accreditati sul tuo wallet!`
          ]
        )

        await client.query('COMMIT')
        
        return {
          success: true,
          status: 'available',
          walletBalance: newBalance
        }
      } else {
        // KYC non approvato, lascia in "pending"
        await client.query('COMMIT')
        
        return {
          success: true,
          status: 'pending',
          requiresKyc: true,
          message: 'KYC non approvato. Completa la verifica per accedere alle commissioni.'
        }
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error processing commission to wallet:', error)
    throw error
  }
}

/**
 * Controlla e processa tutte le commissioni in pending quando KYC viene approvato
 */
async function processPendingCommissionsOnKycApproval(userId) {
  try {
    const result = await pool.query(
      `SELECT id, referrer_id, amount, status 
       FROM commissions 
       WHERE referrer_id = $1 AND status = 'pending'`,
      [userId]
    )

    const pendingCommissions = result.rows

    for (const commission of pendingCommissions) {
      await processCommissionToWallet(commission.id, commission.referrer_id, commission.amount)
    }

    return {
      success: true,
      processed: pendingCommissions.length
    }
  } catch (error) {
    console.error('Error processing pending commissions:', error)
    throw error
  }
}

module.exports = {
  processCommissionToWallet,
  processPendingCommissionsOnKycApproval
}

