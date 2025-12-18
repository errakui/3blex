/**
 * WalletService
 * Gestisce i wallet degli utenti, transazioni e prelievi
 */

const pool = require('../db/index');

class WalletService {
  
  /**
   * Crea un wallet per un nuovo utente
   * @param {string} userId - ID utente
   * @returns {Object} Wallet creato
   */
  async createWallet(userId) {
    const result = await pool.query(
      `INSERT INTO wallets (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Wallet già esistente, ottienilo
      const existing = await pool.query(
        `SELECT * FROM wallets WHERE user_id = $1`,
        [userId]
      );
      return existing.rows[0];
    }
    
    return result.rows[0];
  }
  
  /**
   * Ottieni il wallet di un utente
   * @param {string} userId - ID utente
   * @returns {Object|null} Wallet o null
   */
  async getWallet(userId) {
    const result = await pool.query(
      `SELECT * FROM wallets WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }
  
  /**
   * Ottieni il saldo disponibile
   * @param {string} userId - ID utente
   * @returns {number} Saldo disponibile
   */
  async getAvailableBalance(userId) {
    const wallet = await this.getWallet(userId);
    return parseFloat(wallet?.available_balance) || 0;
  }
  
  /**
   * Accredita una commissione al wallet
   * @param {string} userId - ID utente
   * @param {number} amount - Importo
   * @param {string} type - Tipo transazione
   * @param {string} referenceId - ID commissione
   * @param {boolean} approved - Se KYC approvato, va in available, altrimenti pending
   */
  async creditCommission(userId, amount, type, referenceId, approved = false) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Assicurati che il wallet esista
      let wallet = await this.getWallet(userId);
      if (!wallet) {
        await this.createWallet(userId);
        wallet = await this.getWallet(userId);
      }
      
      const currentAvailable = parseFloat(wallet.available_balance) || 0;
      const currentPending = parseFloat(wallet.pending_balance) || 0;
      
      let newAvailable = currentAvailable;
      let newPending = currentPending;
      
      if (approved) {
        newAvailable += amount;
      } else {
        newPending += amount;
      }
      
      // Aggiorna wallet
      await client.query(
        `UPDATE wallets 
         SET available_balance = $1, 
             pending_balance = $2,
             total_earned = total_earned + $3,
             ${type === 'COMMISSION_DIRECT' ? 'direct_earned = direct_earned + $3,' : ''}
             ${type === 'COMMISSION_BINARY' ? 'binary_earned = binary_earned + $3,' : ''}
             ${type === 'COMMISSION_MULTILEVEL' ? 'multilevel_earned = multilevel_earned + $3,' : ''}
             updated_at = NOW()
         WHERE user_id = $4`,
        [newAvailable, newPending, amount, userId]
      );
      
      // Crea transazione
      await client.query(
        `INSERT INTO wallet_transactions 
         (wallet_id, type, amount, balance_after, status, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, 'commission', $6)`,
        [
          wallet.id,
          type,
          amount,
          approved ? newAvailable : newPending,
          approved ? 'completed' : 'pending',
          referenceId
        ]
      );
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Approva commissioni pending (dopo approvazione KYC)
   * @param {string} userId - ID utente
   */
  async approvePendingCommissions(userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet non trovato');
      }
      
      const pendingBalance = parseFloat(wallet.pending_balance) || 0;
      
      if (pendingBalance > 0) {
        // Sposta da pending a available
        await client.query(
          `UPDATE wallets 
           SET available_balance = available_balance + pending_balance,
               pending_balance = 0,
               updated_at = NOW()
           WHERE user_id = $1`,
          [userId]
        );
        
        // Aggiorna transazioni pending
        await client.query(
          `UPDATE wallet_transactions 
           SET status = 'completed'
           WHERE wallet_id = $1 AND status = 'pending'`,
          [wallet.id]
        );
        
        // Aggiorna commissioni pending
        await client.query(
          `UPDATE commissions 
           SET status = 'approved', approved_at = NOW()
           WHERE user_id = $1 AND status = 'pending'`,
          [userId]
        );
      }
      
      await client.query('COMMIT');
      
      return { approved: pendingBalance };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Richiedi un prelievo
   * @param {string} userId - ID utente
   * @param {number} amount - Importo
   * @param {string} method - Metodo (bank_transfer, paypal, crypto)
   * @param {Object} bankDetails - Dettagli bancari
   */
  async requestWithdrawal(userId, amount, method, bankDetails) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verifica KYC
      const userResult = await client.query(
        `SELECT kyc_status FROM users WHERE id = $1`,
        [userId]
      );
      
      if (userResult.rows[0]?.kyc_status !== 'approved') {
        throw new Error('KYC non approvato. Completa la verifica prima di prelevare.');
      }
      
      // Verifica saldo
      const wallet = await this.getWallet(userId);
      const availableBalance = parseFloat(wallet?.available_balance) || 0;
      
      if (amount > availableBalance) {
        throw new Error(`Saldo insufficiente. Disponibile: €${availableBalance.toFixed(2)}`);
      }
      
      // Verifica importo minimo
      const minWithdrawal = 50;
      if (amount < minWithdrawal) {
        throw new Error(`Importo minimo prelievo: €${minWithdrawal}`);
      }
      
      // Verifica prelievi pending
      const pendingWithdrawals = await client.query(
        `SELECT COUNT(*) as count FROM withdrawals 
         WHERE user_id = $1 AND status IN ('pending', 'processing')`,
        [userId]
      );
      
      if (parseInt(pendingWithdrawals.rows[0].count) > 0) {
        throw new Error('Hai già un prelievo in attesa');
      }
      
      // Calcola fee (es. 2% o minimo €2)
      const feePercentage = 0.02;
      const minFee = 2;
      const fee = Math.max(amount * feePercentage, minFee);
      const netAmount = amount - fee;
      
      // Blocca l'importo
      await client.query(
        `UPDATE wallets 
         SET available_balance = available_balance - $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [amount, userId]
      );
      
      // Crea richiesta prelievo
      const withdrawalResult = await client.query(
        `INSERT INTO withdrawals (user_id, amount, fee, net_amount, method, bank_details)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, amount, fee, netAmount, method, JSON.stringify(bankDetails)]
      );
      
      // Crea transazione wallet
      await client.query(
        `INSERT INTO wallet_transactions 
         (wallet_id, type, amount, balance_after, status, reference_type, reference_id, description)
         VALUES ($1, 'WITHDRAWAL', $2, $3, 'pending', 'withdrawal', $4, $5)`,
        [
          wallet.id,
          -amount,
          availableBalance - amount,
          withdrawalResult.rows[0].id,
          `Prelievo ${method}: €${netAmount.toFixed(2)} (fee: €${fee.toFixed(2)})`
        ]
      );
      
      await client.query('COMMIT');
      
      // Notifica
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Richiesta Prelievo', $2, 'info')`,
        [userId, `La tua richiesta di prelievo di €${netAmount.toFixed(2)} è in elaborazione.`]
      );
      
      return withdrawalResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Approva un prelievo (admin)
   * @param {string} withdrawalId - ID prelievo
   * @param {string} adminId - ID admin
   */
  async approveWithdrawal(withdrawalId, adminId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `UPDATE withdrawals 
         SET status = 'processing', updated_at = NOW()
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [withdrawalId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Prelievo non trovato o già processato');
      }
      
      await client.query('COMMIT');
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Completa un prelievo (dopo il pagamento effettivo)
   * @param {string} withdrawalId - ID prelievo
   */
  async completeWithdrawal(withdrawalId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `UPDATE withdrawals 
         SET status = 'completed', processed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND status = 'processing'
         RETURNING *`,
        [withdrawalId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Prelievo non trovato o stato non valido');
      }
      
      const withdrawal = result.rows[0];
      
      // Aggiorna wallet
      await client.query(
        `UPDATE wallets 
         SET total_withdrawn = total_withdrawn + $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [withdrawal.amount, withdrawal.user_id]
      );
      
      // Aggiorna transazione
      await client.query(
        `UPDATE wallet_transactions 
         SET status = 'completed'
         WHERE reference_type = 'withdrawal' AND reference_id = $1`,
        [withdrawalId]
      );
      
      await client.query('COMMIT');
      
      // Notifica
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Prelievo Completato', $2, 'success')`,
        [withdrawal.user_id, `Il tuo prelievo di €${withdrawal.net_amount} è stato inviato!`]
      );
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Rifiuta un prelievo
   * @param {string} withdrawalId - ID prelievo
   * @param {string} reason - Motivo rifiuto
   */
  async rejectWithdrawal(withdrawalId, reason) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `UPDATE withdrawals 
         SET status = 'rejected', rejection_reason = $2, updated_at = NOW()
         WHERE id = $1 AND status IN ('pending', 'processing')
         RETURNING *`,
        [withdrawalId, reason]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Prelievo non trovato o già completato');
      }
      
      const withdrawal = result.rows[0];
      
      // Restituisci l'importo al wallet
      await client.query(
        `UPDATE wallets 
         SET available_balance = available_balance + $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [withdrawal.amount, withdrawal.user_id]
      );
      
      // Aggiorna transazione
      await client.query(
        `UPDATE wallet_transactions 
         SET status = 'cancelled'
         WHERE reference_type = 'withdrawal' AND reference_id = $1`,
        [withdrawalId]
      );
      
      await client.query('COMMIT');
      
      // Notifica
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Prelievo Rifiutato', $2, 'error')`,
        [withdrawal.user_id, `Il tuo prelievo è stato rifiutato. Motivo: ${reason}`]
      );
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Ottieni storico transazioni
   * @param {string} userId - ID utente
   * @param {Object} options - Opzioni filtro
   */
  async getTransactions(userId, options = {}) {
    const { type, limit = 50, offset = 0 } = options;
    
    const wallet = await this.getWallet(userId);
    if (!wallet) return [];
    
    let query = `
      SELECT * FROM wallet_transactions
      WHERE wallet_id = $1
    `;
    const params = [wallet.id];
    let paramIndex = 2;
    
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  /**
   * Ottieni storico prelievi
   * @param {string} userId - ID utente
   */
  async getWithdrawals(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let query = `SELECT * FROM withdrawals WHERE user_id = $1`;
    const params = [userId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  /**
   * Ottieni statistiche wallet
   * @param {string} userId - ID utente
   */
  async getWalletStats(userId) {
    const wallet = await this.getWallet(userId);
    
    if (!wallet) {
      return {
        available: 0,
        pending: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        directEarned: 0,
        binaryEarned: 0,
        multilevelEarned: 0,
        bonusEarned: 0
      };
    }
    
    return {
      available: parseFloat(wallet.available_balance) || 0,
      pending: parseFloat(wallet.pending_balance) || 0,
      totalEarned: parseFloat(wallet.total_earned) || 0,
      totalWithdrawn: parseFloat(wallet.total_withdrawn) || 0,
      directEarned: parseFloat(wallet.direct_earned) || 0,
      binaryEarned: parseFloat(wallet.binary_earned) || 0,
      multilevelEarned: parseFloat(wallet.multilevel_earned) || 0,
      bonusEarned: parseFloat(wallet.bonus_earned) || 0
    };
  }
}

module.exports = new WalletService();
