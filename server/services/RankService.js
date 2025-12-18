/**
 * RankService
 * Gestisce le qualifiche e i rank degli utenti
 * Rank: UNRANKED → BRONZE → SILVER → GOLD → PLATINUM → DIAMOND
 */

const pool = require('../db/index');
const WalletService = require('./WalletService');

class RankService {
  
  /**
   * Ottieni tutti i rank disponibili
   * @returns {Array} Lista rank ordinata per livello
   */
  async getAllRanks() {
    const result = await pool.query(
      `SELECT * FROM ranks ORDER BY level ASC`
    );
    return result.rows;
  }
  
  /**
   * Ottieni un rank per nome
   * @param {string} name - Nome rank
   * @returns {Object|null} Rank o null
   */
  async getRankByName(name) {
    const result = await pool.query(
      `SELECT * FROM ranks WHERE name = $1`,
      [name]
    );
    return result.rows[0] || null;
  }
  
  /**
   * Valuta e aggiorna il rank di un utente
   * @param {string} userId - ID utente
   * @returns {Object} Risultato valutazione
   */
  async evaluateUserRank(userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Ottieni dati utente
      const userResult = await client.query(
        `SELECT u.*, bt.personal_volume, bt.left_volume, bt.right_volume
         FROM users u
         LEFT JOIN binary_tree bt ON bt.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('Utente non trovato');
      }
      
      const user = userResult.rows[0];
      
      // Calcola metriche
      const personalPV = parseFloat(user.personal_volume) || 0;
      const leftVolume = parseFloat(user.left_volume) || 0;
      const rightVolume = parseFloat(user.right_volume) || 0;
      const groupVolume = leftVolume + rightVolume;
      
      // Conta diretti attivi
      const activeDirectsResult = await client.query(
        `SELECT COUNT(*) as count
         FROM sponsor_tree st
         JOIN users u ON st.user_id = u.id
         JOIN binary_tree bt ON bt.user_id = u.id
         WHERE st.sponsor_id = $1
         AND u.status = 'active'
         AND bt.personal_volume >= 100`,
        [userId]
      );
      const activeDirects = parseInt(activeDirectsResult.rows[0].count) || 0;
      
      // Ottieni tutti i rank (dal più alto al più basso)
      const ranksResult = await client.query(
        `SELECT * FROM ranks ORDER BY level DESC`
      );
      
      // Trova il rank più alto qualificato
      let qualifiedRank = null;
      
      for (const rank of ranksResult.rows) {
        const qualifies = 
          personalPV >= parseFloat(rank.personal_pv_required) &&
          leftVolume >= parseFloat(rank.left_volume_required) &&
          rightVolume >= parseFloat(rank.right_volume_required) &&
          groupVolume >= parseFloat(rank.group_volume_required) &&
          activeDirects >= rank.active_directs_required;
        
        if (qualifies) {
          qualifiedRank = rank;
          break;
        }
      }
      
      if (!qualifiedRank) {
        qualifiedRank = await this.getRankByName('UNRANKED');
      }
      
      const oldRank = user.current_rank;
      const newRank = qualifiedRank.name;
      const rankChanged = oldRank !== newRank;
      const isPromotion = rankChanged && qualifiedRank.level > (await this.getRankByName(oldRank))?.level;
      
      // Aggiorna rank utente
      if (rankChanged) {
        await client.query(
          `UPDATE users 
           SET current_rank = $1,
               highest_rank = CASE 
                 WHEN $2 > (SELECT level FROM ranks WHERE name = highest_rank) 
                 THEN $1 
                 ELSE highest_rank 
               END,
               updated_at = NOW()
           WHERE id = $3`,
          [newRank, qualifiedRank.level, userId]
        );
        
        // Salva storico
        await client.query(
          `INSERT INTO rank_history 
           (user_id, old_rank, new_rank, personal_pv, left_volume, right_volume, group_volume, active_directs)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, oldRank, newRank, personalPV, leftVolume, rightVolume, groupVolume, activeDirects]
        );
        
        // Se è una promozione, paga il bonus una tantum
        if (isPromotion && qualifiedRank.bonus_onetime > 0) {
          // Crea commissione bonus
          const commissionResult = await client.query(
            `INSERT INTO commissions (user_id, type, base_amount, percentage, amount, status)
             VALUES ($1, 'RANK_BONUS', $2, 100, $2, 'approved')
             RETURNING id`,
            [userId, qualifiedRank.bonus_onetime]
          );
          
          // Accredita al wallet
          await WalletService.creditCommission(
            userId,
            qualifiedRank.bonus_onetime,
            'BONUS_RANK',
            commissionResult.rows[0].id,
            user.kyc_status === 'approved'
          );
          
          // Aggiorna storico con bonus pagato
          await client.query(
            `UPDATE rank_history 
             SET bonus_paid = $1
             WHERE user_id = $2 AND new_rank = $3
             ORDER BY achieved_at DESC LIMIT 1`,
            [qualifiedRank.bonus_onetime, userId, newRank]
          );
        }
        
        // Notifica
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, 'success')`,
          [
            userId,
            isPromotion ? '🎉 Nuova Qualifica Raggiunta!' : '📉 Cambio Qualifica',
            isPromotion 
              ? `Congratulazioni! Hai raggiunto il rank ${newRank}!${qualifiedRank.bonus_onetime > 0 ? ` Bonus: €${qualifiedRank.bonus_onetime}` : ''}`
              : `Il tuo rank è cambiato da ${oldRank} a ${newRank}.`
          ]
        );
      }
      
      await client.query('COMMIT');
      
      return {
        userId,
        oldRank,
        newRank,
        rankChanged,
        isPromotion,
        bonusPaid: isPromotion ? qualifiedRank.bonus_onetime : 0,
        metrics: {
          personalPV,
          leftVolume,
          rightVolume,
          groupVolume,
          activeDirects
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
   * Ottieni il progresso verso il prossimo rank
   * @param {string} userId - ID utente
   * @returns {Object} Progresso
   */
  async getRankProgress(userId) {
    // Ottieni dati utente
    const userResult = await pool.query(
      `SELECT u.*, bt.personal_volume, bt.left_volume, bt.right_volume
       FROM users u
       LEFT JOIN binary_tree bt ON bt.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Utente non trovato');
    }
    
    const user = userResult.rows[0];
    
    // Ottieni rank corrente e prossimo
    const currentRank = await this.getRankByName(user.current_rank || 'UNRANKED');
    
    const nextRankResult = await pool.query(
      `SELECT * FROM ranks WHERE level > $1 ORDER BY level ASC LIMIT 1`,
      [currentRank?.level || 0]
    );
    const nextRank = nextRankResult.rows[0];
    
    // Calcola metriche attuali
    const personalPV = parseFloat(user.personal_volume) || 0;
    const leftVolume = parseFloat(user.left_volume) || 0;
    const rightVolume = parseFloat(user.right_volume) || 0;
    const groupVolume = leftVolume + rightVolume;
    
    // Conta diretti attivi
    const activeDirectsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM sponsor_tree st
       JOIN users u ON st.user_id = u.id
       JOIN binary_tree bt ON bt.user_id = u.id
       WHERE st.sponsor_id = $1
       AND u.status = 'active'
       AND bt.personal_volume >= 100`,
      [userId]
    );
    const activeDirects = parseInt(activeDirectsResult.rows[0].count) || 0;
    
    // Calcola progresso verso il prossimo rank
    let progress = null;
    
    if (nextRank) {
      const reqPersonalPV = parseFloat(nextRank.personal_pv_required) || 0;
      const reqLeftVolume = parseFloat(nextRank.left_volume_required) || 0;
      const reqRightVolume = parseFloat(nextRank.right_volume_required) || 0;
      const reqGroupVolume = parseFloat(nextRank.group_volume_required) || 0;
      const reqActiveDirects = nextRank.active_directs_required || 0;
      
      progress = {
        nextRank: {
          name: nextRank.name,
          level: nextRank.level,
          bonusOnetime: parseFloat(nextRank.bonus_onetime) || 0,
          bonusMonthly: parseFloat(nextRank.bonus_monthly) || 0
        },
        requirements: {
          personalPV: {
            current: personalPV,
            required: reqPersonalPV,
            percentage: reqPersonalPV > 0 ? Math.min(100, (personalPV / reqPersonalPV) * 100) : 100,
            missing: Math.max(0, reqPersonalPV - personalPV)
          },
          leftVolume: {
            current: leftVolume,
            required: reqLeftVolume,
            percentage: reqLeftVolume > 0 ? Math.min(100, (leftVolume / reqLeftVolume) * 100) : 100,
            missing: Math.max(0, reqLeftVolume - leftVolume)
          },
          rightVolume: {
            current: rightVolume,
            required: reqRightVolume,
            percentage: reqRightVolume > 0 ? Math.min(100, (rightVolume / reqRightVolume) * 100) : 100,
            missing: Math.max(0, reqRightVolume - rightVolume)
          },
          groupVolume: {
            current: groupVolume,
            required: reqGroupVolume,
            percentage: reqGroupVolume > 0 ? Math.min(100, (groupVolume / reqGroupVolume) * 100) : 100,
            missing: Math.max(0, reqGroupVolume - groupVolume)
          },
          activeDirects: {
            current: activeDirects,
            required: reqActiveDirects,
            percentage: reqActiveDirects > 0 ? Math.min(100, (activeDirects / reqActiveDirects) * 100) : 100,
            missing: Math.max(0, reqActiveDirects - activeDirects)
          }
        },
        overallProgress: 0
      };
      
      // Calcola progresso complessivo (media delle percentuali)
      const percentages = Object.values(progress.requirements).map(r => r.percentage);
      progress.overallProgress = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    }
    
    return {
      currentRank: {
        name: currentRank?.name || 'UNRANKED',
        level: currentRank?.level || 0,
        bonusMonthly: parseFloat(currentRank?.bonus_monthly) || 0
      },
      metrics: {
        personalPV,
        leftVolume,
        rightVolume,
        groupVolume,
        activeDirects
      },
      progress,
      isMaxRank: !nextRank
    };
  }
  
  /**
   * Ottieni storico rank di un utente
   * @param {string} userId - ID utente
   * @returns {Array} Storico rank
   */
  async getRankHistory(userId) {
    const result = await pool.query(
      `SELECT * FROM rank_history 
       WHERE user_id = $1 
       ORDER BY achieved_at DESC`,
      [userId]
    );
    return result.rows;
  }
  
  /**
   * Job mensile per pagare i bonus mensili ai rank qualificati
   */
  async payMonthlyRankBonuses() {
    console.log('🔄 Avvio pagamento bonus mensili rank...');
    
    // Ottieni utenti con rank che hanno bonus mensile
    const usersResult = await pool.query(
      `SELECT u.id, u.email, u.current_rank, u.kyc_status, r.bonus_monthly
       FROM users u
       JOIN ranks r ON u.current_rank = r.name
       WHERE u.status = 'active'
       AND r.bonus_monthly > 0`
    );
    
    const results = {
      processed: 0,
      totalPaid: 0,
      errors: []
    };
    
    for (const user of usersResult.rows) {
      try {
        const bonusAmount = parseFloat(user.bonus_monthly);
        
        // Crea commissione bonus
        const commissionResult = await pool.query(
          `INSERT INTO commissions (user_id, type, base_amount, percentage, amount, status)
           VALUES ($1, 'RANK_BONUS', $2, 100, $2, $3)
           RETURNING id`,
          [user.id, bonusAmount, user.kyc_status === 'approved' ? 'approved' : 'pending']
        );
        
        // Accredita al wallet
        await WalletService.creditCommission(
          user.id,
          bonusAmount,
          'BONUS_RANK',
          commissionResult.rows[0].id,
          user.kyc_status === 'approved'
        );
        
        results.processed++;
        results.totalPaid += bonusAmount;
        
        console.log(`✅ ${user.email} (${user.current_rank}): €${bonusAmount}`);
        
      } catch (error) {
        results.errors.push({ userId: user.id, error: error.message });
        console.error(`❌ ${user.email}: ${error.message}`);
      }
    }
    
    console.log(`📊 Bonus mensili completati: ${results.processed} utenti, €${results.totalPaid.toFixed(2)} totale`);
    
    return results;
  }
  
  /**
   * Ricalcola i rank di tutti gli utenti attivi
   */
  async recalculateAllRanks() {
    console.log('🔄 Ricalcolo rank di tutti gli utenti...');
    
    const usersResult = await pool.query(
      `SELECT id FROM users WHERE status = 'active'`
    );
    
    const results = {
      processed: 0,
      promotions: 0,
      demotions: 0,
      unchanged: 0,
      errors: []
    };
    
    for (const user of usersResult.rows) {
      try {
        const result = await this.evaluateUserRank(user.id);
        
        results.processed++;
        
        if (result.rankChanged) {
          if (result.isPromotion) {
            results.promotions++;
          } else {
            results.demotions++;
          }
        } else {
          results.unchanged++;
        }
        
      } catch (error) {
        results.errors.push({ userId: user.id, error: error.message });
      }
    }
    
    console.log(`📊 Ricalcolo completato: ${results.processed} processati, ${results.promotions} promozioni, ${results.demotions} declassamenti`);
    
    return results;
  }
}

module.exports = new RankService();
