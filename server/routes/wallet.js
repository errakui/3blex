/**
 * Wallet Routes
 * Gestisce wallet, transazioni e prelievi
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const WalletService = require('../services/WalletService');

const router = express.Router();

// Tutte le routes richiedono autenticazione
router.use(authenticateToken);

/**
 * GET /api/wallet
 * Ottieni stato wallet e statistiche
 */
router.get('/', async (req, res) => {
  try {
    const stats = await WalletService.getWalletStats(req.user.id);
    
    res.json({
      success: true,
      wallet: stats
    });
    
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del wallet'
    });
  }
});

/**
 * GET /api/wallet/transactions
 * Lista transazioni wallet
 */
router.get('/transactions', async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    
    const transactions = await WalletService.getTransactions(req.user.id, {
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      transactions
    });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle transazioni'
    });
  }
});

/**
 * GET /api/wallet/withdrawals
 * Storico prelievi
 */
router.get('/withdrawals', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const withdrawals = await WalletService.getWithdrawals(req.user.id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      withdrawals
    });
    
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei prelievi'
    });
  }
});

/**
 * POST /api/wallet/withdraw
 * Richiedi un prelievo
 */
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, method, bankDetails } = req.body;
    
    // Validazione
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Importo non valido'
      });
    }
    
    if (!method || !['bank_transfer', 'paypal', 'crypto'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Metodo di prelievo non valido'
      });
    }
    
    if (method === 'bank_transfer' && (!bankDetails || !bankDetails.iban)) {
      return res.status(400).json({
        success: false,
        message: 'IBAN richiesto per bonifico bancario'
      });
    }
    
    const withdrawal = await WalletService.requestWithdrawal(
      req.user.id,
      parseFloat(amount),
      method,
      bankDetails || {}
    );
    
    res.json({
      success: true,
      message: 'Richiesta di prelievo inviata',
      withdrawal
    });
    
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/wallet/withdrawals/:id/approve (Admin)
 * Approva un prelievo
 */
router.post('/withdrawals/:id/approve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const withdrawal = await WalletService.approveWithdrawal(
      req.params.id,
      req.user.id
    );
    
    res.json({
      success: true,
      message: 'Prelievo approvato',
      withdrawal
    });
    
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/wallet/withdrawals/:id/complete (Admin)
 * Completa un prelievo (dopo il pagamento)
 */
router.post('/withdrawals/:id/complete', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const withdrawal = await WalletService.completeWithdrawal(req.params.id);
    
    res.json({
      success: true,
      message: 'Prelievo completato',
      withdrawal
    });
    
  } catch (error) {
    console.error('Complete withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/wallet/withdrawals/:id/reject (Admin)
 * Rifiuta un prelievo
 */
router.post('/withdrawals/:id/reject', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Motivo rifiuto richiesto'
      });
    }
    
    const withdrawal = await WalletService.rejectWithdrawal(req.params.id, reason);
    
    res.json({
      success: true,
      message: 'Prelievo rifiutato',
      withdrawal
    });
    
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/wallet/admin/pending (Admin)
 * Lista prelievi in attesa
 */
router.get('/admin/pending', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      });
    }
    
    const pool = require('../db/index');
    
    const result = await pool.query(
      `SELECT w.*, u.email, u.first_name, u.last_name
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       WHERE w.status IN ('pending', 'processing')
       ORDER BY w.created_at ASC`
    );
    
    res.json({
      success: true,
      withdrawals: result.rows
    });
    
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei prelievi'
    });
  }
});

module.exports = router;
