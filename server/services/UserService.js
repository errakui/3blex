/**
 * UserService
 * Gestisce registrazione, attivazione e gestione utenti
 */

const pool = require('../db/index');
const bcrypt = require('bcryptjs');
const BinaryTreeService = require('./BinaryTreeService');
const SponsorTreeService = require('./SponsorTreeService');
const WalletService = require('./WalletService');
const CommissionService = require('./CommissionService');
const RankService = require('./RankService');

class UserService {
  
  /**
   * Registra un nuovo utente
   * @param {Object} userData - Dati utente
   * @param {string} referralCode - Codice referral dello sponsor (opzionale)
   * @returns {Object} Utente creato
   */
  async register(userData, referralCode = null) {
    const { email, password, firstName, lastName, phone } = userData;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verifica email già esistente
      const existingUser = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('Email già registrata');
      }
      
      // Trova lo sponsor se c'è un referral code
      let sponsorId = null;
      if (referralCode) {
        const sponsorResult = await client.query(
          `SELECT id, status FROM users WHERE referral_code = $1`,
          [referralCode.toUpperCase()]
        );
        
        if (sponsorResult.rows.length > 0 && sponsorResult.rows[0].status === 'active') {
          sponsorId = sponsorResult.rows[0].id;
        }
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Genera referral code univoco
      let newReferralCode;
      let isUnique = false;
      while (!isUnique) {
        newReferralCode = await this.generateReferralCode();
        const check = await client.query(
          `SELECT id FROM users WHERE referral_code = $1`,
          [newReferralCode]
        );
        isUnique = check.rows.length === 0;
      }
      
      // Crea utente
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, referral_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [email.toLowerCase(), passwordHash, firstName, lastName, phone, newReferralCode]
      );
      
      const user = userResult.rows[0];
      
      // Registra relazione sponsor
      if (sponsorId) {
        await SponsorTreeService.registerSponsor(user.id, sponsorId);
      }
      
      // Crea wallet
      await WalletService.createWallet(user.id);
      
      // Notifica di benvenuto
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Benvenuto in 3Blex!', 'Il tuo account è stato creato. Acquista un pack di attivazione per iniziare a guadagnare!', 'info')`,
        [user.id]
      );
      
      await client.query('COMMIT');
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        referralCode: user.referral_code,
        status: user.status,
        sponsorId
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Attiva un utente dopo il primo acquisto
   * @param {string} userId - ID utente
   * @param {string} orderId - ID ordine di attivazione
   * @param {string} preferredLeg - Gamba preferita ('left' | 'right' | 'auto')
   */
  async activateUser(userId, orderId, preferredLeg = 'auto') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Ottieni utente e sponsor
      const userResult = await client.query(
        `SELECT u.*, st.sponsor_id
         FROM users u
         LEFT JOIN sponsor_tree st ON st.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('Utente non trovato');
      }
      
      const user = userResult.rows[0];
      
      if (user.status === 'active') {
        throw new Error('Utente già attivo');
      }
      
      // Verifica che lo sponsor abbia un nodo nell'albero binario
      // Se non c'è uno sponsor, l'utente va sotto la root (azienda)
      let sponsorIdForBinary = user.sponsor_id;
      
      if (!sponsorIdForBinary) {
        // Trova o crea la root dell'albero
        const rootResult = await client.query(
          `SELECT user_id FROM binary_tree WHERE parent_id IS NULL LIMIT 1`
        );
        
        if (rootResult.rows.length === 0) {
          // Questo è il primo utente, diventa root
          await BinaryTreeService.createRootNode(userId);
        } else {
          sponsorIdForBinary = rootResult.rows[0].user_id;
        }
      }
      
      // Posiziona nell'albero binario (se non è root)
      if (sponsorIdForBinary) {
        await BinaryTreeService.placeUser(userId, sponsorIdForBinary, preferredLeg);
      }
      
      // Attiva utente
      await client.query(
        `UPDATE users 
         SET status = 'active', activated_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );
      
      // Segna ordine come ordine di attivazione
      await client.query(
        `UPDATE orders SET is_activation_order = TRUE WHERE id = $1`,
        [orderId]
      );
      
      await client.query('COMMIT');
      
      // Processa commissioni per l'ordine
      await CommissionService.processOrderCommissions(orderId);
      
      // Valuta rank iniziale
      await RankService.evaluateUserRank(userId);
      
      // Aggiorna volumi dell'albero binario
      const orderResult = await pool.query(
        `SELECT pv_amount FROM orders WHERE id = $1`,
        [orderId]
      );
      
      if (orderResult.rows[0]?.pv_amount) {
        await BinaryTreeService.updateVolumes(userId, parseFloat(orderResult.rows[0].pv_amount));
      }
      
      // Notifica
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, '🎉 Account Attivato!', 'Il tuo account è ora attivo. Inizia a costruire il tuo network!', 'success')`,
        [userId]
      );
      
      // Notifica allo sponsor
      if (user.sponsor_id) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, 'Nuovo Affiliato Attivato!', $2, 'success')`,
          [user.sponsor_id, `${user.first_name} ${user.last_name} si è attivato nel tuo team!`]
        );
      }
      
      return { success: true, userId };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Genera un referral code univoco
   */
  async generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Ottieni profilo utente completo
   * @param {string} userId - ID utente
   */
  async getUserProfile(userId) {
    const userResult = await pool.query(
      `SELECT u.*, bt.personal_volume, bt.left_volume, bt.right_volume, bt.depth,
              st.sponsor_id,
              su.first_name as sponsor_first_name, su.last_name as sponsor_last_name
       FROM users u
       LEFT JOIN binary_tree bt ON bt.user_id = u.id
       LEFT JOIN sponsor_tree st ON st.user_id = u.id
       LEFT JOIN users su ON st.sponsor_id = su.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return null;
    }
    
    const user = userResult.rows[0];
    
    // Ottieni statistiche wallet
    const walletStats = await WalletService.getWalletStats(userId);
    
    // Ottieni progresso rank
    const rankProgress = await RankService.getRankProgress(userId);
    
    // Ottieni statistiche sponsor tree
    const sponsorStats = await SponsorTreeService.getStats(userId);
    
    // Ottieni statistiche albero binario
    const binaryStats = await BinaryTreeService.getStats(userId);
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      referralCode: user.referral_code,
      status: user.status,
      role: user.role,
      kycStatus: user.kyc_status,
      currentRank: user.current_rank,
      highestRank: user.highest_rank,
      createdAt: user.created_at,
      activatedAt: user.activated_at,
      sponsor: user.sponsor_id ? {
        id: user.sponsor_id,
        name: `${user.sponsor_first_name} ${user.sponsor_last_name}`
      } : null,
      wallet: walletStats,
      rank: rankProgress,
      sponsorTree: sponsorStats,
      binaryTree: binaryStats
    };
  }
  
  /**
   * Verifica login utente
   * @param {string} email - Email
   * @param {string} password - Password
   */
  async verifyLogin(email, password) {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Email o password non validi');
    }
    
    const user = result.rows[0];
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      throw new Error('Email o password non validi');
    }
    
    if (user.status === 'suspended') {
      throw new Error('Account sospeso. Contatta il supporto.');
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      currentRank: user.current_rank,
      kycStatus: user.kyc_status
    };
  }
  
  /**
   * Aggiorna profilo utente
   * @param {string} userId - ID utente
   * @param {Object} updates - Campi da aggiornare
   */
  async updateProfile(userId, updates) {
    const allowedFields = ['first_name', 'last_name', 'phone'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        updateFields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      throw new Error('Nessun campo valido da aggiornare');
    }
    
    values.push(userId);
    
    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }
  
  /**
   * Cambia password utente
   * @param {string} userId - ID utente
   * @param {string} currentPassword - Password attuale
   * @param {string} newPassword - Nuova password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const userResult = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Utente non trovato');
    }
    
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    
    if (!isValid) {
      throw new Error('Password attuale non corretta');
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newPasswordHash, userId]
    );
    
    return { success: true };
  }
  
  /**
   * Ottieni utente per referral code
   * @param {string} referralCode - Codice referral
   */
  async getUserByReferralCode(referralCode) {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, status, current_rank
       FROM users 
       WHERE referral_code = $1 AND status = 'active'`,
      [referralCode.toUpperCase()]
    );
    return result.rows[0] || null;
  }
  
  /**
   * Lista utenti (admin)
   */
  async listUsers(options = {}) {
    const { status, role, search, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT u.*, bt.personal_volume, bt.left_volume, bt.right_volume,
             (SELECT COUNT(*) FROM sponsor_tree WHERE sponsor_id = u.id) as direct_count
      FROM users u
      LEFT JOIN binary_tree bt ON bt.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND u.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new UserService();
