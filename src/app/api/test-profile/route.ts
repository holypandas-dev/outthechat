import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not logged in', user: null })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: 'Test Update' })
    .eq('id', user.id)
    .select()

  return NextResponse.json({ 
    user_id: user.id,
    update_result: data,
    update_error: error,
    error_details: error ? JSON.stringify(error) : null
  })
}
