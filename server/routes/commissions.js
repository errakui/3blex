/**
 * Commissions Routes
 * Gestisce commissioni e relativi endpoint
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const CommissionService = require('../services/CommissionService');

const router = express.Router();

// Tutte le routes richiedono autenticazione
router.use(authenticateToken);

/**
 * GET /api/commissions
 * Lista commissioni dell'utente
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, limit = 50, offset = 0 } = req.query;
    
    const commissions = await CommissionService.getUserCommissions(req.user.id, {
      type,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      commissions
    });
    
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle commissioni'
    });
  }
});

/**
 * GET /api/commissions/summary
 * Riepilogo commissioni per tipo
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await CommissionService.getUserCommissionsSummary(req.user.id);
    
    res.json({
      success: true,
      summary
    });
    
  } catch (error) {
    console.error('Get commissions summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del riepilogo commissioni'
    });
  }
});

/**
 * GET /api/commissions/binary-history
 * Storico calcoli commissione binaria
 */
router.get('/binary-history', async (req, res) => {
  try {
    const pool = require('../db/index');
    
    const result = await pool.query(
      `SELECT * FROM volume_periods
       WHERE user_id = $1
       ORDER BY period_end DESC
       LIMIT 12`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      periods: result.rows.map(p => ({
        id: p.id,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        leftVolume: parseFloat(p.left_volume) || 0,
        rightVolume: parseFloat(p.right_volume) || 0,
        totalLeft: parseFloat(p.total_left) || 0,
        totalRight: parseFloat(p.total_right) || 0,
        matchedVolume: parseFloat(p.matched_volume) || 0,
        commission: parseFloat(p.binary_commission) || 0,
        carryoverLeft: parseFloat(p.new_carryover_left) || 0,
        carryoverRight: parseFloat(p.new_carryover_right) || 0,
        status: p.status,
        calculatedAt: p.calculated_at
      }))
    });
    
  } catch (error) {
    console.error('Get binary history error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello storico binario'
    });
  }
});

/**
 * POST /api/commissions/calculate-binary (Admin)
 * Trigger manuale calcolo commissione binaria
 */
router.post('/calculate-binary', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const { userId } = req.body;
    
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setHours(23, 59, 59, 999);
    
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 7);
    periodStart.setHours(0, 0, 0, 0);
    
    if (userId) {
      // Calcola per un singolo utente
      const result = await CommissionService.calculateBinaryCommission(
        userId,
        periodStart,
        periodEnd
      );
      
      res.json({
        success: true,
        result
      });
    } else {
      // Calcola per tutti
      const results = await CommissionService.runWeeklyBinaryCalculation();
      
      res.json({
        success: true,
        results
      });
    }
    
  } catch (error) {
    console.error('Calculate binary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/commissions/process-order (Admin)
 * Ricalcola commissioni per un ordine
 */
router.post('/process-order', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID richiesto'
      });
    }
    
    await CommissionService.processOrderCommissions(orderId);
    
    res.json({
      success: true,
      message: 'Commissioni processate con successo'
    });
    
  } catch (error) {
    console.error('Process order commissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/commissions/config (Admin)
 * Ottieni configurazione commissioni
 */
router.get('/config', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const pool = require('../db/index');
    const result = await pool.query(`SELECT * FROM commission_config`);
    
    res.json({
      success: true,
      config: result.rows
    });
    
  } catch (error) {
    console.error('Get commission config error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della configurazione'
    });
  }
});

/**
 * PUT /api/commissions/config/:type (Admin)
 * Aggiorna configurazione commissione
 */
router.put('/config/:type', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const { type } = req.params;
    const { config } = req.body;
    
    const pool = require('../db/index');
    await pool.query(
      `UPDATE commission_config SET config = $1, updated_at = NOW() WHERE type = $2`,
      [JSON.stringify(config), type.toUpperCase()]
    );
    
    res.json({
      success: true,
      message: 'Configurazione aggiornata'
    });
    
  } catch (error) {
    console.error('Update commission config error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della configurazione'
    });
  }
});

module.exports = router;
