import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, or WebP.' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Ensure avatars bucket exists
  const { data: buckets } = await admin.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === 'avatars')

  if (!bucketExists) {
    const { error: bucketError } = await admin.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    if (bucketError) {
      return NextResponse.json({ error: 'Could not create storage bucket' }, { status: 500 })
    }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage
    .from('avatars')
    .getPublicUrl(path)

  // Append cache-busting param so the browser picks up the new image
  const url = `${publicUrl}?v=${Date.now()}`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ url })
}
