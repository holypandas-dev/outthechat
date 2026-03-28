import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated', authError }, { status: 401 })
  }

  const { data, error: updateError } = await supabase
    .from('profiles')
    .update({ display_name: 'Test Update' })
    .eq('id', user.id)
    .select()

  return NextResponse.json({
    userId: user.id,
    updateResult: data,
    updateError,
  })
}
