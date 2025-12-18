const express = require('express')
const Stripe = require('stripe')
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/index')

const router = express.Router()

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key'
const stripe = stripeKey && !stripeKey.includes('placeholder') && stripeKey !== 'sk_test_your_stripe_secret_key'
  ? new Stripe(stripeKey)
  : null

const PLANS = {
  monthly: {
    name: 'Piano Mensile',
    amount: 9999, // €99.99 in cents
    interval: 'month',
  },
  annual: {
    name: 'Piano Annuale',
    amount: 100000, // €1000.99 in cents
    interval: 'year',
  },
}

// Helper function to create commission for referrer
async function createCommissionForReferrer(userId, subscriptionId, planId, plan) {
  try {
    // Get user's referrer
    const userResult = await pool.query(
      'SELECT referred_by FROM users WHERE id = $1',
      [userId]
    )
    const referredBy = userResult.rows[0]?.referred_by

    if (referredBy) {
      // Check if referrer has active subscription
      const referrerResult = await pool.query(
        `SELECT subscription_status FROM users WHERE id = $1`,
        [referredBy]
      )

      if (referrerResult.rows[0]?.subscription_status === 'active') {
        // Calculate commission (20% of subscription amount)
        const commissionAmount = (plan.amount / 100) * 0.2

        // Create commission
        await pool.query(
          `INSERT INTO commissions (referrer_id, referred_id, subscription_id, amount, percentage, status)
           VALUES ($1, $2, $3, $4, 20.00, 'pending')`,
          [referredBy, userId, subscriptionId, commissionAmount]
        )

        // Notify referrer
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, 'Nuova commissione!', 
                  $2, 
                  'success')`,
          [referredBy, `Hai guadagnato €${commissionAmount.toFixed(2)} da un nuovo affiliato.`]
        )
      }
    }
  } catch (error) {
    console.error('Error creating commission:', error)
  }
}

// Create checkout session
router.post('/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body
    const userId = req.user.id

    console.log('Subscription request - userId:', userId, 'planId:', planId)

    if (!planId || !PLANS[planId]) {
      return res.status(400).json({ message: 'Piano non valido' })
    }

    const plan = PLANS[planId]

    // Create subscription record
    const subscriptionResult = await pool.query(
      `INSERT INTO subscriptions (user_id, plan, amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [userId, planId, plan.amount / 100]
    )

    const subscriptionId = subscriptionResult.rows[0].id
    console.log('Subscription created - id:', subscriptionId)

    // Se Stripe non è configurato, attiva direttamente
    if (!stripe) {
      console.log('Stripe non configurato - attivazione diretta abbonamento')
      
      // Attivazione diretta per test senza Stripe
      const startDate = new Date()
      const endDate = new Date()
      if (planId === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }

      // Update subscription
      await pool.query(
        `UPDATE subscriptions 
         SET status = 'completed', start_date = $1, end_date = $2
         WHERE id = $3`,
        [startDate, endDate, subscriptionId]
      )

      // Update user role and subscription status
      await pool.query(
        `UPDATE users 
         SET role = 'network_member',
             subscription_status = 'active',
             subscription_plan = $1,
             subscription_start_date = $2,
             subscription_end_date = $3
         WHERE id = $4`,
        [planId, startDate, endDate, userId]
      )

      // Verify update
      const verifyUser = await pool.query(
        'SELECT id, email, role, subscription_status FROM users WHERE id = $1',
        [userId]
      )
      console.log('✅ User updated to network_member:', verifyUser.rows[0])

      // Create commission for referrer if exists
      await createCommissionForReferrer(userId, subscriptionId, planId, plan)

      // Auto-place in binary tree if has referrer
      const userRefResult = await pool.query(
        'SELECT referred_by FROM users WHERE id = $1',
        [userId]
      )
      const referredBy = userRefResult.rows[0]?.referred_by

      if (referredBy) {
        try {
          // Use auto-placement logic
          const sponsorResult = await pool.query(
            `SELECT left_volume, right_volume,
                    (SELECT COUNT(*) FROM users WHERE referred_by = $1 AND placement_side = 'left') as left_count,
                    (SELECT COUNT(*) FROM users WHERE referred_by = $1 AND placement_side = 'right') as right_count
             FROM users WHERE id = $1`,
            [referredBy]
          )

          if (sponsorResult.rows.length > 0) {
            const sponsor = sponsorResult.rows[0]
            const leftVolume = parseFloat(sponsor.left_volume) || 0
            const rightVolume = parseFloat(sponsor.right_volume) || 0
            const leftCount = parseInt(sponsor.left_count) || 0
            const rightCount = parseInt(sponsor.right_count) || 0

            const placementSide = leftVolume < rightVolume 
              ? 'left' 
              : rightVolume < leftVolume 
              ? 'right' 
              : leftCount < rightCount 
              ? 'left' 
              : 'right'

            await pool.query(
              placementSide === 'left'
                ? `UPDATE users SET left_leg = $1, placement_side = 'left' WHERE id = $2`
                : `UPDATE users SET right_leg = $1, placement_side = 'right' WHERE id = $2`,
              [userId, referredBy]
            )

            await pool.query(
              `UPDATE users SET placement_side = $1 WHERE id = $2`,
              [placementSide, userId]
            )
          }
        } catch (error) {
          console.error('Error auto-placing affiliate:', error)
          // Don't fail subscription if placement fails
        }
      }

      return res.json({ 
        success: true,
        message: 'Abbonamento attivato con successo!',
        subscriptionId,
        user: verifyUser.rows[0]
      })
    }

    // Create Stripe checkout session (se Stripe è configurato)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: plan.name,
            },
            unit_amount: plan.amount,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/cancel`,
      metadata: {
        userId: userId.toString(),
        subscriptionId: subscriptionId.toString(),
        planId,
      },
    })

    // Update subscription with Stripe session ID
    await pool.query(
      'UPDATE subscriptions SET stripe_payment_intent_id = $1 WHERE id = $2',
      [session.id, subscriptionId]
    )

    res.json({ checkoutUrl: session.url })
  } catch (error) {
    console.error('Checkout creation error:', error)
    res.status(500).json({ message: 'Errore nella creazione del checkout: ' + error.message })
  }
})

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ message: 'Stripe non configurato' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const metadata = session.metadata

    if (metadata && metadata.userId && metadata.subscriptionId) {
      const userId = parseInt(metadata.userId)
      const subscriptionId = parseInt(metadata.subscriptionId)
      const planId = metadata.planId

      // Calculate subscription dates
      const startDate = new Date()
      const endDate = new Date()
      if (planId === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }

      // Update subscription
      await pool.query(
        `UPDATE subscriptions 
         SET status = 'completed', start_date = $1, end_date = $2
         WHERE id = $3`,
        [startDate, endDate, subscriptionId]
      )

      // Update user role and subscription status
      await pool.query(
        `UPDATE users 
         SET role = 'network_member',
             subscription_status = 'active',
             subscription_plan = $1,
             subscription_start_date = $2,
             subscription_end_date = $3
         WHERE id = $4`,
        [planId, startDate, endDate, userId]
      )

      // Create commission for referrer
      const plan = PLANS[planId]
      await createCommissionForReferrer(userId, subscriptionId, planId, plan)
    }
  }

  res.json({ received: true })
})

module.exports = router
