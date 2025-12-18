const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken } = require('../middleware/auth')

// ============================================
// GET BINARY TREE STRUCTURE
// ============================================
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Recursive function to get binary tree
    async function getBinaryTree(nodeId, level = 0, maxLevel = 5) {
      if (!nodeId || level > maxLevel) return null

      const userResult = await pool.query(
        `SELECT 
          id, name, email, 
          left_leg, right_leg, 
          personal_volume as pv,
          group_volume as gv,
          left_volume, right_volume,
          subscription_status,
          current_rank
        FROM users WHERE id = $1`,
        [nodeId]
      )

      if (userResult.rows.length === 0) return null

      const user = userResult.rows[0]

      const tree = {
        id: user.id,
        name: user.name,
        email: user.email,
        pv: parseFloat(user.pv) || 0,
        gv: parseFloat(user.gv) || 0,
        leftVolume: parseFloat(user.left_volume) || 0,
        rightVolume: parseFloat(user.right_volume) || 0,
        subscriptionStatus: user.subscription_status,
        rank: user.current_rank,
        left: null,
        right: null,
        level
      }

      // Get children
      if (user.left_leg) {
        tree.left = await getBinaryTree(user.left_leg, level + 1, maxLevel)
      }
      if (user.right_leg) {
        tree.right = await getBinaryTree(user.right_leg, level + 1, maxLevel)
      }

      return tree
    }

    const tree = await getBinaryTree(userId)

    res.json({
      success: true,
      tree
    })

  } catch (error) {
    console.error('Error fetching binary tree:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero della struttura binaria' })
  }
})

// ============================================
// PLACE AFFILIATE IN BINARY TREE
// ============================================
router.post('/place', authenticateToken, async (req, res) => {
  try {
    const { newAffiliateId, preferredSide } = req.body // preferredSide: 'left' | 'right' | 'auto'
    const sponsorId = req.user.id

    if (!newAffiliateId) {
      return res.status(400).json({ success: false, message: 'ID affiliato richiesto' })
    }

    // Verify new affiliate exists and is referred by current user
    const affiliateResult = await pool.query(
      `SELECT id, referred_by, left_leg, right_leg 
       FROM users WHERE id = $1`,
      [newAffiliateId]
    )

    if (affiliateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Affiliato non trovato' })
    }

    const affiliate = affiliateResult.rows[0]

    if (affiliate.referred_by !== sponsorId) {
      return res.status(403).json({ success: false, message: 'Non puoi posizionare questo affiliato' })
    }

    if (affiliate.left_leg || affiliate.right_leg) {
      return res.status(400).json({ success: false, message: 'Affiliato già posizionato' })
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      let placementSide = preferredSide

      // Auto-placement: find the leg with less volume
      if (!placementSide || placementSide === 'auto') {
        const sponsorResult = await client.query(
          `SELECT left_volume, right_volume, 
                  (SELECT COUNT(*) FROM users WHERE referred_by = $1 AND placement_side = 'left') as left_count,
                  (SELECT COUNT(*) FROM users WHERE referred_by = $1 AND placement_side = 'right') as right_count
           FROM users WHERE id = $1`,
          [sponsorId]
        )

        if (sponsorResult.rows.length === 0) {
          throw new Error('Sponsor non trovato')
        }

        const sponsor = sponsorResult.rows[0]
        const leftVolume = parseFloat(sponsor.left_volume) || 0
        const rightVolume = parseFloat(sponsor.right_volume) || 0
        const leftCount = parseInt(sponsor.left_count) || 0
        const rightCount = parseInt(sponsor.right_count) || 0

        // Place in leg with less volume, or if equal, less count
        if (leftVolume < rightVolume) {
          placementSide = 'left'
        } else if (rightVolume > leftVolume) {
          placementSide = 'right'
        } else if (leftCount < rightCount) {
          placementSide = 'left'
        } else {
          placementSide = 'right'
        }
      }

      // Place affiliate
      if (placementSide === 'left') {
        await client.query(
          `UPDATE users 
           SET left_leg = $1, placement_side = 'left'
           WHERE id = $2`,
          [newAffiliateId, sponsorId]
        )
      } else {
        await client.query(
          `UPDATE users 
           SET right_leg = $1, placement_side = 'right'
           WHERE id = $2`,
          [newAffiliateId, sponsorId]
        )
      }

      // Update affiliate placement_side
      await client.query(
        `UPDATE users SET placement_side = $1 WHERE id = $2`,
        [placementSide, newAffiliateId]
      )

      // Recalculate volumes
      await recalculateVolumes(client, sponsorId)

      await client.query('COMMIT')

      res.json({
        success: true,
        message: `Affiliato posizionato nella gamba ${placementSide === 'left' ? 'sinistra' : 'destra'}`,
        placementSide
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error placing affiliate:', error)
    res.status(500).json({ success: false, message: 'Errore nel posizionamento: ' + error.message })
  }
})

// ============================================
// RECALCULATE VOLUMES FOR BINARY TREE
// ============================================
async function recalculateVolumes(client, userId) {
  // Recursive function to calculate volumes
  async function calculateNodeVolumes(nodeId) {
    const userResult = await client.query(
      `SELECT 
        id, personal_volume as pv,
        left_leg, right_leg
      FROM users WHERE id = $1`,
      [nodeId]
    )

    if (userResult.rows.length === 0) {
      return { pv: 0, gv: 0, leftVolume: 0, rightVolume: 0 }
    }

    const user = userResult.rows[0]
    const personalVolume = parseFloat(user.pv) || 0

    let leftVolume = 0
    let rightVolume = 0
    let leftGv = 0
    let rightGv = 0

    // Calculate left leg volumes
    if (user.left_leg) {
      const leftVolumes = await calculateNodeVolumes(user.left_leg)
      leftVolume = leftVolumes.gv + leftVolumes.pv
      leftGv = leftVolumes.gv
    }

    // Calculate right leg volumes
    if (user.right_leg) {
      const rightVolumes = await calculateNodeVolumes(user.right_leg)
      rightVolume = rightVolumes.gv + rightVolumes.pv
      rightGv = rightVolumes.gv
    }

    // Group volume is sum of personal + left + right
    const groupVolume = personalVolume + leftVolume + rightVolume

    // Update user volumes
    await client.query(
      `UPDATE users 
       SET left_volume = $1, right_volume = $2, group_volume = $3
       WHERE id = $4`,
      [leftVolume, rightVolume, groupVolume, nodeId]
    )

    return {
      pv: personalVolume,
      gv: groupVolume,
      leftVolume,
      rightVolume
    }
  }

  await calculateNodeVolumes(userId)
}

// ============================================
// RECALCULATE ALL VOLUMES (Admin)
// ============================================
router.post('/recalculate-volumes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accesso negato' })
    }

    const { userId } = req.body
    const targetUserId = userId || req.user.id

    const client = await pool.connect()

    try {
      await client.query('BEGIN')
      await recalculateVolumes(client, targetUserId)
      await client.query('COMMIT')

      res.json({
        success: true,
        message: 'Volumi ricalcolati con successo'
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error recalculating volumes:', error)
    res.status(500).json({ success: false, message: 'Errore nel ricalcolo volumi' })
  }
})

// ============================================
// GET BINARY STATISTICS
// ============================================
router.get('/binary-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT 
        personal_volume as pv,
        group_volume as gv,
        left_volume,
        right_volume,
        (SELECT COUNT(*) FROM users WHERE referred_by = $1 AND placement_side = 'left') as left_count,
        (SELECT COUNT(*) FROM users WHERE referred_by = $1 AND placement_side = 'right') as right_count,
        (SELECT COUNT(*) FROM users WHERE referred_by = $1) as total_direct
      FROM users WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' })
    }

    const stats = result.rows[0]
    const weakerLeg = parseFloat(stats.left_volume) < parseFloat(stats.right_volume) ? 'left' : 'right'
    const weakerLegVolume = weakerLeg === 'left' ? parseFloat(stats.left_volume) : parseFloat(stats.right_volume)
    const strongerLegVolume = weakerLeg === 'left' ? parseFloat(stats.right_volume) : parseFloat(stats.left_volume)
    const carryover = Math.max(0, strongerLegVolume - weakerLegVolume)

    res.json({
      success: true,
      stats: {
        pv: parseFloat(stats.pv) || 0,
        gv: parseFloat(stats.gv) || 0,
        leftVolume: parseFloat(stats.left_volume) || 0,
        rightVolume: parseFloat(stats.right_volume) || 0,
        leftCount: parseInt(stats.left_count) || 0,
        rightCount: parseInt(stats.right_count) || 0,
        totalDirect: parseInt(stats.total_direct) || 0,
        weakerLeg,
        weakerLegVolume,
        strongerLegVolume,
        carryover,
        balancePercentage: stats.left_volume && stats.right_volume 
          ? Math.round((Math.min(stats.left_volume, stats.right_volume) / Math.max(stats.left_volume, stats.right_volume)) * 100)
          : 0
      }
    })

  } catch (error) {
    console.error('Error fetching binary stats:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero statistiche binario' })
  }
})

module.exports = router

