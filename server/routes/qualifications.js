/**
 * Qualifications Routes
 * Gestisce rank e qualifiche
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const RankService = require('../services/RankService');

const router = express.Router();

// Tutte le routes richiedono autenticazione
router.use(authenticateToken);

/**
 * GET /api/qualifications/ranks
 * Lista tutti i rank disponibili
 */
router.get('/ranks', async (req, res) => {
  try {
    const ranks = await RankService.getAllRanks();
    
    res.json({
      success: true,
      ranks: ranks.map(r => ({
        id: r.id,
        name: r.name,
        level: r.level,
        requirements: {
          personalPV: parseFloat(r.personal_pv_required) || 0,
          leftVolume: parseFloat(r.left_volume_required) || 0,
          rightVolume: parseFloat(r.right_volume_required) || 0,
          groupVolume: parseFloat(r.group_volume_required) || 0,
          activeDirects: r.active_directs_required || 0
        },
        rewards: {
          bonusOnetime: parseFloat(r.bonus_onetime) || 0,
          bonusMonthly: parseFloat(r.bonus_monthly) || 0,
          commissionMultiplier: parseFloat(r.commission_multiplier) || 1,
          poolShares: r.pool_shares || 0
        }
      }))
    });
    
  } catch (error) {
    console.error('Get ranks error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei rank'
    });
  }
});

/**
 * GET /api/qualifications/my-progress
 * Ottieni progresso verso il prossimo rank
 */
router.get('/my-progress', async (req, res) => {
  try {
    const progress = await RankService.getRankProgress(req.user.id);
    
    res.json({
      success: true,
      ...progress
    });
    
  } catch (error) {
    console.error('Get rank progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del progresso rank'
    });
  }
});

/**
 * GET /api/qualifications/history
 * Storico qualifiche raggiunte
 */
router.get('/history', async (req, res) => {
  try {
    const history = await RankService.getRankHistory(req.user.id);
    
    res.json({
      success: true,
      history: history.map(h => ({
        id: h.id,
        oldRank: h.old_rank,
        newRank: h.new_rank,
        achievedAt: h.achieved_at,
        bonusPaid: parseFloat(h.bonus_paid) || 0,
        metrics: {
          personalPV: parseFloat(h.personal_pv) || 0,
          leftVolume: parseFloat(h.left_volume) || 0,
          rightVolume: parseFloat(h.right_volume) || 0,
          groupVolume: parseFloat(h.group_volume) || 0,
          activeDirects: h.active_directs || 0
        }
      }))
    });
    
  } catch (error) {
    console.error('Get rank history error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello storico rank'
    });
  }
});

/**
 * POST /api/qualifications/evaluate
 * Valuta il rank di un utente (Admin o self)
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUserId = userId || req.user.id;
    
    // Solo admin può valutare altri utenti
    if (userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const result = await RankService.evaluateUserRank(targetUserId);
    
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('Evaluate rank error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/qualifications/recalculate-all (Admin)
 * Ricalcola i rank di tutti gli utenti
 */
router.post('/recalculate-all', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const results = await RankService.recalculateAllRanks();
    
    res.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Recalculate all ranks error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/qualifications/pay-monthly-bonuses (Admin)
 * Paga i bonus mensili
 */
router.post('/pay-monthly-bonuses', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const results = await RankService.payMonthlyRankBonuses();
    
    res.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Pay monthly bonuses error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/qualifications/leaderboard
 * Classifica per rank
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const pool = require('../db/index');
    const { rank, limit = 50 } = req.query;
    
    let query = `
      SELECT u.id, u.first_name, u.last_name, u.current_rank, u.highest_rank,
             bt.personal_volume, bt.left_volume, bt.right_volume,
             (bt.left_volume + bt.right_volume) as group_volume
      FROM users u
      LEFT JOIN binary_tree bt ON bt.user_id = u.id
      WHERE u.status = 'active'
    `;
    const params = [];
    
    if (rank) {
      query += ` AND u.current_rank = $1`;
      params.push(rank);
    }
    
    query += ` ORDER BY group_volume DESC NULLS LAST LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      leaderboard: result.rows.map((u, index) => ({
        position: index + 1,
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        rank: u.current_rank,
        highestRank: u.highest_rank,
        personalVolume: parseFloat(u.personal_volume) || 0,
        leftVolume: parseFloat(u.left_volume) || 0,
        rightVolume: parseFloat(u.right_volume) || 0,
        groupVolume: parseFloat(u.group_volume) || 0
      }))
    });
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della classifica'
    });
  }
});

module.exports = router;
