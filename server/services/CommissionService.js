/**
 * CommissionService
 * Gestisce il calcolo e distribuzione delle commissioni
 * - Commissione Diretta: 20% sul primo ordine degli sponsorizzati diretti
 * - Commissione Binaria: 10% sulla gamba debole (settimanale)
 * - Commissione Multilivello: fino a 10 livelli basata sullo Sponsor Tree
 */

const pool = require('../db/index');
const WalletService = require('./WalletService');

class CommissionService {
  
  constructor() {
    // Configurazione di default (verrà caricata dal DB)
    this.config = {
      direct: { percentage: 20, first_order_only: true },
      binary: { percentage: 10, weekly_cap: 10000, min_personal_pv: 100, max_carryover_cycles: 3 },
      multilevel: {
        levels: [5, 3, 2, 1.5, 1, 1, 0.75, 0.5, 0.5, 0.25],
        pv_requirements: [100, 100, 150, 150, 200, 200, 250, 250, 300, 300]
      }
    };
  }
  
  /**
   * Carica la configurazione commissioni dal database
   */
  async loadConfig() {
    const result = await pool.query(
      `SELECT type, config FROM commission_config WHERE is_active = TRUE`
    );
    
    result.rows.forEach(row => {
      const type = row.type.toLowerCase();
      if (this.config[type]) {
        this.config[type] = { ...this.config[type], ...row.config };
      }
    });
  }
  
  /**
   * Processa tutte le commissioni per un ordine
   * @param {string} orderId - ID ordine
   */
  async processOrderCommissions(orderId) {
    await this.loadConfig();
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Ottieni dettagli ordine
      const orderResult = await client.query(
        `SELECT o.*, u.id as user_id, st.sponsor_id
         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN sponsor_tree st ON st.user_id = u.id
         WHERE o.id = $1`,
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        throw new Error('Ordine non trovato');
      }
      
      const order = orderResult.rows[0];
      
      if (order.commissions_processed) {
        throw new Error('Commissioni già processate per questo ordine');
      }
      
      // 1. Commissione Diretta (20%)
      if (order.sponsor_id) {
        await this.processDirectCommission(client, order);
      }
      
      // 2. Commissioni Multilivello (fino a 10 livelli)
      await this.processMultilevelCommissions(client, order);
      
      // Segna ordine come processato
      await client.query(
        `UPDATE orders SET commissions_processed = TRUE WHERE id = $1`,
        [orderId]
      );
      
      await client.query('COMMIT');
      
      return { success: true, orderId };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Commissione Diretta: 20% sul primo ordine degli sponsorizzati diretti
   */
  async processDirectCommission(client, order) {
    // Verifica se è il primo ordine (ordine di attivazione)
    if (this.config.direct.first_order_only) {
      const previousOrders = await client.query(
        `SELECT COUNT(*) as count FROM orders 
         WHERE user_id = $1 AND id != $2 AND payment_status = 'completed'`,
        [order.user_id, order.id]
      );
      
      if (parseInt(previousOrders.rows[0].count) > 0) {
        console.log('Commissione diretta: non è il primo ordine, skip');
        return;
      }
    }
    
    // Verifica che lo sponsor esista e sia attivo
    const sponsorResult = await client.query(
      `SELECT u.*, bt.personal_volume, w.id as wallet_id
       FROM users u
       LEFT JOIN binary_tree bt ON bt.user_id = u.id
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = $1 AND u.status = 'active'`,
      [order.sponsor_id]
    );
    
    if (sponsorResult.rows.length === 0) {
      console.log('Commissione diretta: sponsor non attivo, skip');
      return;
    }
    
    const sponsor = sponsorResult.rows[0];
    const percentage = this.config.direct.percentage;
    const commissionAmount = (parseFloat(order.commissionable_amount) * percentage) / 100;
    
    // Crea record commissione
    const commissionResult = await client.query(
      `INSERT INTO commissions (user_id, order_id, source_user_id, type, base_amount, percentage, amount, status)
       VALUES ($1, $2, $3, 'DIRECT', $4, $5, $6, $7)
       RETURNING id`,
      [
        order.sponsor_id,
        order.id,
        order.user_id,
        order.commissionable_amount,
        percentage,
        commissionAmount,
        sponsor.kyc_status === 'approved' ? 'approved' : 'pending'
      ]
    );
    
    // Accredita al wallet
    await WalletService.creditCommission(
      order.sponsor_id,
      commissionAmount,
      'COMMISSION_DIRECT',
      commissionResult.rows[0].id,
      sponsor.kyc_status === 'approved'
    );
    
    // Notifica
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Nuova Commissione Diretta', $2, 'success')`,
      [order.sponsor_id, `Hai guadagnato €${commissionAmount.toFixed(2)} dalla commissione diretta!`]
    );
    
    console.log(`Commissione diretta: €${commissionAmount.toFixed(2)} a ${sponsor.email}`);
  }
  
  /**
   * Commissioni Multilivello: basate sullo Sponsor Tree fino a 10 livelli
   */
  async processMultilevelCommissions(client, order) {
    const levels = this.config.multilevel.levels;
    const pvRequirements = this.config.multilevel.pv_requirements;
    
    // Ottieni l'upline dello sponsor tree
    const uplineResult = await client.query(
      `SELECT u.*, stc.depth as level, bt.personal_volume, w.id as wallet_id
       FROM sponsor_tree_closure stc
       JOIN users u ON stc.ancestor_id = u.id
       LEFT JOIN binary_tree bt ON bt.user_id = u.id
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE stc.descendant_id = $1
       AND stc.depth <= $2
       AND u.status = 'active'
       ORDER BY stc.depth ASC`,
      [order.user_id, levels.length]
    );
    
    for (const sponsor of uplineResult.rows) {
      const level = sponsor.level; // 1-based
      const levelIndex = level - 1;
      
      if (levelIndex >= levels.length) continue;
      
      const percentage = levels[levelIndex];
      const requiredPV = pvRequirements[levelIndex];
      const sponsorPV = parseFloat(sponsor.personal_volume) || 0;
      
      // Verifica requisito PV
      if (sponsorPV < requiredPV) {
        console.log(`Multilivello L${level}: ${sponsor.email} non ha abbastanza PV (${sponsorPV}/${requiredPV}), skip`);
        continue;
      }
      
      const commissionAmount = (parseFloat(order.commissionable_amount) * percentage) / 100;
      
      // Crea record commissione
      const commissionResult = await client.query(
        `INSERT INTO commissions (user_id, order_id, source_user_id, type, sponsor_level, base_amount, percentage, amount, status)
         VALUES ($1, $2, $3, 'MULTILEVEL', $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          sponsor.id,
          order.id,
          order.user_id,
          level,
          order.commissionable_amount,
          percentage,
          commissionAmount,
          sponsor.kyc_status === 'approved' ? 'approved' : 'pending'
        ]
      );
      
      // Accredita al wallet
      await WalletService.creditCommission(
        sponsor.id,
        commissionAmount,
        'COMMISSION_MULTILEVEL',
        commissionResult.rows[0].id,
        sponsor.kyc_status === 'approved'
      );
      
      console.log(`Multilivello L${level}: €${commissionAmount.toFixed(2)} (${percentage}%) a ${sponsor.email}`);
    }
  }
  
  /**
   * Calcola commissione binaria per un utente (settimanale)
   * @param {string} userId - ID utente
   * @param {Date} periodStart - Inizio periodo
   * @param {Date} periodEnd - Fine periodo
   */
  async calculateBinaryCommission(userId, periodStart, periodEnd) {
    await this.loadConfig();
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Ottieni dati utente
      const userResult = await client.query(
        `SELECT u.*, bt.left_volume, bt.right_volume, bt.personal_volume,
                cl.left_carryover, cl.right_carryover, cl.left_cycles, cl.right_cycles,
                w.id as wallet_id
         FROM users u
         JOIN binary_tree bt ON bt.user_id = u.id
         LEFT JOIN carryover_ledger cl ON cl.user_id = u.id
         LEFT JOIN wallets w ON w.user_id = u.id
         WHERE u.id = $1 AND u.status = 'active'`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('Utente non trovato o non attivo');
      }
      
      const user = userResult.rows[0];
      
      // Verifica requisito PV personale
      const personalPV = parseFloat(user.personal_volume) || 0;
      if (personalPV < this.config.binary.min_personal_pv) {
        console.log(`Binary: ${user.email} non ha abbastanza PV personale (${personalPV}/${this.config.binary.min_personal_pv})`);
        return { success: false, reason: 'PV personale insufficiente' };
      }
      
      // Calcola volumi del periodo (qui semplifico usando i volumi cumulativi)
      let leftVolume = parseFloat(user.left_volume) || 0;
      let rightVolume = parseFloat(user.right_volume) || 0;
      
      // Aggiungi carryover
      const leftCarryover = parseFloat(user.left_carryover) || 0;
      const rightCarryover = parseFloat(user.right_carryover) || 0;
      leftVolume += leftCarryover;
      rightVolume += rightCarryover;
      
      // Identifica gamba debole
      const weakLegVolume = Math.min(leftVolume, rightVolume);
      const strongLegVolume = Math.max(leftVolume, rightVolume);
      const weakLegSide = leftVolume <= rightVolume ? 'left' : 'right';
      
      // Calcola commissione
      let commissionAmount = (weakLegVolume * this.config.binary.percentage) / 100;
      
      // Applica CAP settimanale
      if (commissionAmount > this.config.binary.weekly_cap) {
        commissionAmount = this.config.binary.weekly_cap;
      }
      
      // Calcola nuovo carryover
      const matchedVolume = weakLegVolume;
      let newCarryoverLeft = weakLegSide === 'left' ? 0 : strongLegVolume - matchedVolume;
      let newCarryoverRight = weakLegSide === 'right' ? 0 : strongLegVolume - matchedVolume;
      
      // Verifica cicli di carryover (max 3)
      let leftCycles = parseInt(user.left_cycles) || 0;
      let rightCycles = parseInt(user.right_cycles) || 0;
      
      if (newCarryoverLeft > 0) {
        leftCycles++;
        if (leftCycles > this.config.binary.max_carryover_cycles) {
          newCarryoverLeft = 0;
          leftCycles = 0;
        }
      } else {
        leftCycles = 0;
      }
      
      if (newCarryoverRight > 0) {
        rightCycles++;
        if (rightCycles > this.config.binary.max_carryover_cycles) {
          newCarryoverRight = 0;
          rightCycles = 0;
        }
      } else {
        rightCycles = 0;
      }
      
      // Crea record periodo
      const periodResult = await client.query(
        `INSERT INTO volume_periods 
         (user_id, period_start, period_end, period_type, left_volume, right_volume, personal_volume,
          carryover_left, carryover_right, total_left, total_right, matched_volume, binary_commission,
          new_carryover_left, new_carryover_right, status, calculated_at)
         VALUES ($1, $2, $3, 'weekly', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'closed', NOW())
         RETURNING id`,
        [
          userId, periodStart, periodEnd,
          user.left_volume, user.right_volume, personalPV,
          leftCarryover, rightCarryover,
          leftVolume, rightVolume,
          matchedVolume, commissionAmount,
          newCarryoverLeft, newCarryoverRight
        ]
      );
      
      // Aggiorna carryover ledger
      await client.query(
        `INSERT INTO carryover_ledger (user_id, left_carryover, right_carryover, left_cycles, right_cycles)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           left_carryover = $2, right_carryover = $3,
           left_cycles = $4, right_cycles = $5,
           updated_at = NOW()`,
        [userId, newCarryoverLeft, newCarryoverRight, leftCycles, rightCycles]
      );
      
      // Crea record commissione
      const commissionResult = await client.query(
        `INSERT INTO commissions (user_id, type, base_amount, percentage, amount, status, period_id)
         VALUES ($1, 'BINARY', $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          userId, weakLegVolume, this.config.binary.percentage, commissionAmount,
          user.kyc_status === 'approved' ? 'approved' : 'pending',
          periodResult.rows[0].id
        ]
      );
      
      // Accredita al wallet
      if (commissionAmount > 0) {
        await WalletService.creditCommission(
          userId,
          commissionAmount,
          'COMMISSION_BINARY',
          commissionResult.rows[0].id,
          user.kyc_status === 'approved'
        );
      }
      
      await client.query('COMMIT');
      
      // Notifica
      if (commissionAmount > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, 'Commissione Binaria Settimanale', $2, 'success')`,
          [userId, `Hai guadagnato €${commissionAmount.toFixed(2)} dalla commissione binaria! Volume abbinato: €${matchedVolume.toFixed(2)}`]
        );
      }
      
      return {
        success: true,
        leftVolume,
        rightVolume,
        weakLegVolume,
        matchedVolume,
        commission: commissionAmount,
        newCarryover: {
          left: newCarryoverLeft,
          right: newCarryoverRight
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Job settimanale per calcolare le commissioni binarie di tutti gli utenti attivi
   */
  async runWeeklyBinaryCalculation() {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setHours(23, 59, 59, 999);
    
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 7);
    periodStart.setHours(0, 0, 0, 0);
    
    console.log(`🔄 Avvio calcolo binario settimanale: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);
    
    // Ottieni tutti gli utenti attivi con abbonamento
    const usersResult = await pool.query(
      `SELECT u.id, u.email
       FROM users u
       JOIN binary_tree bt ON bt.user_id = u.id
       WHERE u.status = 'active'
       AND bt.personal_volume >= $1`,
      [this.config.binary.min_personal_pv]
    );
    
    const results = {
      processed: 0,
      skipped: 0,
      totalCommission: 0,
      errors: []
    };
    
    for (const user of usersResult.rows) {
      try {
        const result = await this.calculateBinaryCommission(user.id, periodStart, periodEnd);
        
        if (result.success) {
          results.processed++;
          results.totalCommission += result.commission;
          console.log(`✅ ${user.email}: €${result.commission.toFixed(2)}`);
        } else {
          results.skipped++;
          console.log(`⏭️ ${user.email}: ${result.reason}`);
        }
      } catch (error) {
        results.errors.push({ userId: user.id, error: error.message });
        console.error(`❌ ${user.email}: ${error.message}`);
      }
    }
    
    console.log(`📊 Calcolo completato: ${results.processed} processati, ${results.skipped} saltati, €${results.totalCommission.toFixed(2)} totale`);
    
    return results;
  }
  
  /**
   * Ottieni riepilogo commissioni di un utente
   */
  async getUserCommissionsSummary(userId) {
    const result = await pool.query(
      `SELECT 
         type,
         COUNT(*) as count,
         SUM(amount) as total,
         SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved,
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid
       FROM commissions
       WHERE user_id = $1
       GROUP BY type`,
      [userId]
    );
    
    const summary = {
      direct: { count: 0, total: 0, approved: 0, pending: 0, paid: 0 },
      binary: { count: 0, total: 0, approved: 0, pending: 0, paid: 0 },
      multilevel: { count: 0, total: 0, approved: 0, pending: 0, paid: 0 },
      total: { count: 0, total: 0, approved: 0, pending: 0, paid: 0 }
    };
    
    result.rows.forEach(row => {
      const key = row.type.toLowerCase();
      if (summary[key]) {
        summary[key] = {
          count: parseInt(row.count),
          total: parseFloat(row.total) || 0,
          approved: parseFloat(row.approved) || 0,
          pending: parseFloat(row.pending) || 0,
          paid: parseFloat(row.paid) || 0
        };
      }
      
      summary.total.count += parseInt(row.count);
      summary.total.total += parseFloat(row.total) || 0;
      summary.total.approved += parseFloat(row.approved) || 0;
      summary.total.pending += parseFloat(row.pending) || 0;
      summary.total.paid += parseFloat(row.paid) || 0;
    });
    
    return summary;
  }
  
  /**
   * Ottieni lista commissioni di un utente
   */
  async getUserCommissions(userId, options = {}) {
    const { type, status, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT c.*, 
             su.first_name as source_first_name, su.last_name as source_last_name,
             o.order_number
      FROM commissions c
      LEFT JOIN users su ON c.source_user_id = su.id
      LEFT JOIN orders o ON c.order_id = o.id
      WHERE c.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    if (type) {
      query += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new CommissionService();
