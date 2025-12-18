/**
 * Network Routes
 * Gestisce albero binario e sponsor tree
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const BinaryTreeService = require('../services/BinaryTreeService');
const SponsorTreeService = require('../services/SponsorTreeService');

const router = express.Router();

// Tutte le routes richiedono autenticazione
router.use(authenticateToken);

/**
 * GET /api/network/binary-tree
 * Ottieni l'albero binario dell'utente
 */
router.get('/binary-tree', async (req, res) => {
  try {
    const { depth = 5 } = req.query;
    
    const tree = await BinaryTreeService.getTree(req.user.id, parseInt(depth));
    
    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Non sei ancora posizionato nell\'albero binario. Attiva il tuo account acquistando un pack.'
      });
    }
    
    res.json({
      success: true,
      tree
    });
    
  } catch (error) {
    console.error('Get binary tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dell\'albero binario'
    });
  }
});

/**
 * GET /api/network/binary-stats
 * Ottieni statistiche dell'albero binario
 */
router.get('/binary-stats', async (req, res) => {
  try {
    const stats = await BinaryTreeService.getStats(req.user.id);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Statistiche non disponibili'
      });
    }
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get binary stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
});

/**
 * GET /api/network/sponsor-tree
 * Ottieni lo sponsor tree (chi hai sponsorizzato)
 */
router.get('/sponsor-tree', async (req, res) => {
  try {
    const { depth = 5 } = req.query;
    
    const tree = await SponsorTreeService.getSponsorTree(req.user.id, parseInt(depth));
    
    res.json({
      success: true,
      tree
    });
    
  } catch (error) {
    console.error('Get sponsor tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello sponsor tree'
    });
  }
});

/**
 * GET /api/network/sponsor-stats
 * Ottieni statistiche dello sponsor tree
 */
router.get('/sponsor-stats', async (req, res) => {
  try {
    const stats = await SponsorTreeService.getStats(req.user.id);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get sponsor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche sponsor'
    });
  }
});

/**
 * GET /api/network/directs
 * Ottieni i tuoi affiliati diretti
 */
router.get('/directs', async (req, res) => {
  try {
    const directs = await SponsorTreeService.getDirectSponsored(req.user.id);
    
    res.json({
      success: true,
      directs,
      count: directs.length
    });
    
  } catch (error) {
    console.error('Get directs error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli affiliati diretti'
    });
  }
});

/**
 * GET /api/network/upline
 * Ottieni la tua upline (sponsor fino alla root)
 */
router.get('/upline', async (req, res) => {
  try {
    const { maxLevels = 10 } = req.query;
    
    const upline = await SponsorTreeService.getUpline(req.user.id, parseInt(maxLevels));
    
    res.json({
      success: true,
      upline,
      count: upline.length
    });
    
  } catch (error) {
    console.error('Get upline error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della upline'
    });
  }
});

/**
 * GET /api/network/downline
 * Ottieni la tua downline completa
 */
router.get('/downline', async (req, res) => {
  try {
    const { maxLevels = 10 } = req.query;
    
    const downline = await SponsorTreeService.getDownline(req.user.id, parseInt(maxLevels));
    const byLevel = await SponsorTreeService.countDownlineByLevel(req.user.id);
    
    res.json({
      success: true,
      downline,
      count: downline.length,
      byLevel
    });
    
  } catch (error) {
    console.error('Get downline error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della downline'
    });
  }
});

/**
 * GET /api/network/dashboard
 * Dashboard network completo
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Ottieni tutte le statistiche in parallelo
    const [binaryStats, sponsorStats, directs] = await Promise.all([
      BinaryTreeService.getStats(req.user.id),
      SponsorTreeService.getStats(req.user.id),
      SponsorTreeService.getDirectSponsored(req.user.id)
    ]);
    
    // Calcola statistiche aggiuntive
    const activeDirects = directs.filter(d => d.status === 'active').length;
    
    res.json({
      success: true,
      dashboard: {
        binary: binaryStats || {
          leftVolume: 0,
          rightVolume: 0,
          personalVolume: 0,
          groupVolume: 0,
          weakerLeg: 'left',
          balancePercentage: 0
        },
        sponsor: sponsorStats,
        directs: {
          total: directs.length,
          active: activeDirects,
          list: directs.slice(0, 10) // Ultimi 10
        },
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${req.user.referralCode || ''}`
      }
    });
    
  } catch (error) {
    console.error('Get network dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della dashboard'
    });
  }
});

/**
 * POST /api/network/place
 * Posiziona manualmente un affiliato nell'albero (admin o sponsor)
 */
router.post('/place', async (req, res) => {
  try {
    const { affiliateId, preferredLeg } = req.body;
    
    if (!affiliateId) {
      return res.status(400).json({
        success: false,
        message: 'ID affiliato richiesto'
      });
    }
    
    if (preferredLeg && !['left', 'right', 'auto'].includes(preferredLeg)) {
      return res.status(400).json({
        success: false,
        message: 'Gamba non valida. Usa: left, right o auto'
      });
    }
    
    // Verifica che l'affiliato sia sponsorizzato dall'utente corrente
    const sponsor = await SponsorTreeService.getSponsor(affiliateId);
    
    if (sponsor?.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Puoi posizionare solo i tuoi affiliati diretti'
      });
    }
    
    const result = await BinaryTreeService.placeUser(
      affiliateId, 
      req.user.id, 
      preferredLeg || 'auto'
    );
    
    res.json({
      success: true,
      message: `Affiliato posizionato nella gamba ${result.position}${result.isSpillover ? ' (spillover)' : ''}`,
      placement: result
    });
    
  } catch (error) {
    console.error('Place affiliate error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
