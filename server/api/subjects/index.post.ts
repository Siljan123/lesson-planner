import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  
  // Verify user is authenticated
  const user = await serverSupabaseUser(event)
  const { data: { user: authUser } } = await client.auth.getUser()
  const currentUserId = user?.id || (user as any)?.sub || authUser?.id

  if (!currentUserId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const rawName = String(body?.name || '').trim()
  const rawCode = String(body?.code || '').trim()

  if (!rawName || rawName.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Subject name must be at least 2 characters long' })
  }

  if (rawName.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Subject name cannot exceed 100 characters' })
  }

  // Check if subject already exists (case-insensitive)
  const { data: existingByName } = await client
    .from('subjects')
    .select('*')
    .ilike('name', rawName)
    .maybeSingle()

  if (existingByName) {
    return {
      ...existingByName,
      isExisting: true
    }
  }

  // Generate code if not provided
  let baseCode = rawCode.toUpperCase()
  if (!baseCode) {
    const words = rawName.split(/\s+/).filter(Boolean)
    if (words.length > 1) {
      baseCode = words.map(w => w[0]).join('').toUpperCase()
    } else {
      baseCode = rawName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)
    }
  }

  // Clean code to uppercase alphanumeric and hyphens
  baseCode = baseCode.replace(/[^A-Z0-9_-]/g, '') || 'SUBJ'

  // Ensure unique code
  let finalCode = baseCode
  let counter = 1
  while (true) {
    const { data: existingCode } = await client
      .from('subjects')
      .select('id')
      .eq('code', finalCode)
      .maybeSingle()

    if (!existingCode) break
    finalCode = `${baseCode}-${counter}`
    counter++
  }

  // Insert subject using service role if available, or client
  let insertClient: any = client
  try {
    const serviceRole = serverSupabaseServiceRole<Database>(event)
    if (serviceRole) {
      insertClient = serviceRole
    }
  } catch {
    insertClient = client
  }

  const { data: newSubject, error: insertError } = await insertClient
    .from('subjects')
    .insert({
      name: rawName,
      code: finalCode
    })
    .select('*')
    .single()

  if (insertError || !newSubject) {
    throw createError({
      statusCode: 500,
      statusMessage: insertError?.message || 'Failed to create subject'
    })
  }

  return {
    ...newSubject,
    isExisting: false
  }
})
