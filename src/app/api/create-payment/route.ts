// Required Supabase table (run once in SQL editor):
//
// create table fund_contributions (
//   id uuid default gen_random_uuid() primary key,
//   trip_id uuid references trips(id) on delete cascade,
//   user_id uuid references auth.users(id),
//   amount integer not null,          -- stored in cents
//   stripe_session_id text unique,
//   status text default 'pending',    -- 'pending' | 'paid'
//   created_at timestamptz default now()
// );
// alter table fund_contributions enable row level security;
// create policy "Members read contributions" on fund_contributions for select
//   using (exists (select 1 from trip_members where trip_id = fund_contributions.trip_id and user_id = auth.uid()));
// create policy "Members insert contributions" on fund_contributions for insert
//   with check (user_id = auth.uid());
// create policy "Members update own contributions" on fund_contributions for update
//   using (user_id = auth.uid());

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId, amount } = await request.json()

    if (!tripId || !amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Verify user is a trip member
    const { data: member } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) return NextResponse.json({ error: 'Not a trip member' }, { status: 403 })

    const { data: trip } = await supabase
      .from('trips')
      .select('title, destination')
      .eq('id', tripId)
      .single()

    const amountInCents = Math.round(amount * 100)
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Group Fund: ${trip?.title || 'Trip'}`,
            description: `Contribution toward ${trip?.destination || 'your trip'}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      success_url: `${origin}/trip/${tripId}/fund?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/trip/${tripId}/fund?cancelled=true`,
      metadata: { tripId, userId: user.id },
    })

    // Record as pending — marked paid on success redirect via fund page
    await supabase.from('fund_contributions').insert({
      trip_id: tripId,
      user_id: user.id,
      amount: amountInCents,
      stripe_session_id: session.id,
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
