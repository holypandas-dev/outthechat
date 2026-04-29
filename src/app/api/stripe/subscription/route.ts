// To set up premium pricing:
// 1. In Stripe dashboard, create a recurring product: $9/month
// 2. Copy the Price ID (price_xxxx) and add to Vercel env:
//    STRIPE_PREMIUM_PRICE_ID=price_xxxx
// 3. Make sure STRIPE_SECRET_KEY is also set in production

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Premium plan not configured' }, { status: 500 })
  }

  const origin = request.headers.get('origin') || 'https://outthechat.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?cancelled=true`,
    customer_email: user.email,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
  })

  return NextResponse.json({ url: session.url })
}
