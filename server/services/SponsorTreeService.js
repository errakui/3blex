/**
 * SponsorTreeService
 * Gestisce le relazioni di sponsorizzazione (chi ha reclutato chi)
 * Separato dall'albero binario come da specifiche 3blex.md
 */

const pool = require('../db/index');

class SponsorTreeService {
  
  /**
   * Registra una relazione sponsor-affiliato
   * @param {string} userId - ID del nuovo affiliato
   * @param {string} sponsorId - ID dello sponsor (null se sponsorizzato dall'azienda)
   * @returns {Object} Record creato
   */
  async registerSponsor(userId, sponsorId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verifica che l'utente non abbia già uno sponsor
      const existing = await client.query(
        `SELECT id FROM sponsor_tree WHERE user_id = $1`,
        [userId]
      );
      
      if (existing.rows.length > 0) {
        throw new Error('L\'utente ha già uno sponsor registrato');
      }
      
      // Crea la relazione sponsor
      const result = await client.query(
        `INSERT INTO sponsor_tree (user_id, sponsor_id, level)
         VALUES ($1, $2, 1)
         RETURNING *`,
        [userId, sponsorId]
      );
      
      // Il trigger aggiornerà automaticamente sponsor_tree_closure
      
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
   * Ottieni lo sponsor diretto di un utente
   * @param {string} userId - ID utente
   * @returns {Object|null} Sponsor o null
   */
  async getSponsor(userId) {
    const result = await pool.query(
      `SELECT u.*, st.level
       FROM sponsor_tree st
       JOIN users u ON st.sponsor_id = u.id
       WHERE st.user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }
  
  /**
   * Ottieni tutti gli affiliati diretti sponsorizzati da un utente
   * @param {string} sponsorId - ID sponsor
   * @returns {Array} Lista affiliati diretti
   */
  async getDirectSponsored(sponsorId) {
    const result = await pool.query(
      `SELECT u.*, st.created_at as sponsored_at
       FROM sponsor_tree st
       JOIN users u ON st.user_id = u.id
       WHERE st.sponsor_id = $1
       ORDER BY st.created_at DESC`,
      [sponsorId]
    );
    return result.rows;
  }
  
  /**
   * Conta gli affiliati diretti ATTIVI (con almeno 100 PV nel mese)
   * @param {string} sponsorId - ID sponsor
   * @returns {number} Conteggio
   */
  async countActiveDirectSponsored(sponsorId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM sponsor_tree st
       JOIN users u ON st.user_id = u.id
       JOIN binary_tree bt ON bt.user_id = u.id
       WHERE st.sponsor_id = $1
       AND u.status = 'active'
       AND bt.personal_volume >= 100`,
      [sponsorId]
    );
    return parseInt(result.rows[0].count) || 0;
  }
  
  /**
   * Ottieni l'upline completa (tutti gli sponsor fino alla root)
   * @param {string} userId - ID utente
   * @param {number} maxLevels - Numero massimo di livelli (default 10)
   * @returns {Array} Lista upline ordinata dal più vicino al più lontano
   */
  async getUpline(userId, maxLevels = 10) {
    const result = await pool.query(
      `SELECT u.*, stc.depth as level
       FROM sponsor_tree_closure stc
       JOIN users u ON stc.ancestor_id = u.id
       WHERE stc.descendant_id = $1
       AND stc.depth <= $2
       ORDER BY stc.depth ASC`,
      [userId, maxLevels]
    );
    return result.rows;
  }
  
  /**
   * Ottieni tutti i discendenti (downline) di un utente
   * @param {string} userId - ID utente
   * @param {number} maxLevels - Numero massimo di livelli
   * @returns {Array} Lista discendenti con livello
   */
  async getDownline(userId, maxLevels = 10) {
    const result = await pool.query(
      `SELECT u.*, stc.depth as level
       FROM sponsor_tree_closure stc
       JOIN users u ON stc.descendant_id = u.id
       WHERE stc.ancestor_id = $1
       AND stc.depth <= $2
       ORDER BY stc.depth ASC, u.created_at DESC`,
      [userId, maxLevels]
    );
    return result.rows;
  }
  
  /**
   * Conta i discendenti per livello
   * @param {string} userId - ID utente
   * @returns {Object} Conteggio per livello
   */
  async countDownlineByLevel(userId) {
    const result = await pool.query(
      `SELECT depth as level, COUNT(*) as count
       FROM sponsor_tree_closure
       WHERE ancestor_id = $1
       GROUP BY depth
       ORDER BY depth ASC`,
      [userId]
    );
    
    const counts = {};
    result.rows.forEach(row => {
      counts[`level_${row.level}`] = parseInt(row.count);
    });
    
    return counts;
  }
  
  /**
   * Ottieni lo sponsor tree completo come struttura ad albero
   * @param {string} userId - ID utente root
   * @param {number} maxDepth - Profondità massima
   * @returns {Object} Albero sponsor
   */
  async getSponsorTree(userId, maxDepth = 5) {
    return this.buildSponsorTreeRecursive(userId, 0, maxDepth);
  }
  
  /**
   * Costruisce l'albero sponsor ricorsivamente
   */
  async buildSponsorTreeRecursive(userId, currentDepth, maxDepth) {
    if (currentDepth > maxDepth) return null;
    
    const userResult = await pool.query(
      `SELECT u.*, bt.personal_volume, bt.left_volume, bt.right_volume
       FROM users u
       LEFT JOIN binary_tree bt ON bt.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) return null;
    
    const user = userResult.rows[0];
    
    // Ottieni i diretti sponsorizzati
    const directsResult = await pool.query(
      `SELECT st.user_id
       FROM sponsor_tree st
       WHERE st.sponsor_id = $1
       ORDER BY st.created_at ASC`,
      [userId]
    );
    
    const node = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      status: user.status,
      rank: user.current_rank,
      personalVolume: parseFloat(user.personal_volume) || 0,
      level: currentDepth,
      children: []
    };
    
    // Carica figli ricorsivamente
    for (const direct of directsResult.rows) {
      const child = await this.buildSponsorTreeRecursive(direct.user_id, currentDepth + 1, maxDepth);
      if (child) {
        node.children.push(child);
      }
    }
    
    return node;
  }
  
  /**
   * Verifica se un utente è nella downline di un altro
   * @param {string} potentialAncestorId - Potenziale antenato
   * @param {string} potentialDescendantId - Potenziale discendente
   * @returns {boolean}
   */
  async isInDownline(potentialAncestorId, potentialDescendantId) {
    const result = await pool.query(
      `SELECT 1 FROM sponsor_tree_closure
       WHERE ancestor_id = $1 AND descendant_id = $2`,
      [potentialAncestorId, potentialDescendantId]
    );
    return result.rows.length > 0;
  }
  
  /**
   * Ottieni statistiche sponsor di un utente
   * @param {string} userId - ID utente
   * @returns {Object} Statistiche
   */
  async getStats(userId) {
    // Conteggio per livello
    const levelCounts = await this.countDownlineByLevel(userId);
    
    // Totale downline
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM sponsor_tree_closure WHERE ancestor_id = $1`,
      [userId]
    );
    
    // Diretti
    const directsResult = await pool.query(
      `SELECT COUNT(*) as count FROM sponsor_tree WHERE sponsor_id = $1`,
      [userId]
    );
    
    // Diretti attivi
    const activeDirects = await this.countActiveDirectSponsored(userId);
    
    return {
      totalDownline: parseInt(totalResult.rows[0].total) || 0,
      directSponsored: parseInt(directsResult.rows[0].count) || 0,
      activeDirectSponsored: activeDirects,
      byLevel: levelCounts
    };
  }
}

module.exports = new SponsorTreeService();
