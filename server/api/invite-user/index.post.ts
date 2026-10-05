import { serverSupabaseServiceRole, serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  full_name: z.string().trim().optional().nullable(),
  role: z.enum(['admin', 'teacher']).default('teacher'),
  school_id: z.string().optional().nullable(),
  redirectTo: z.string().url().optional().or(z.literal(''))
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const callerUserId = (user as any).sub || user.id

  const client = await serverSupabaseClient<Database>(event)
  const { data: callerProfile } = await client.from('profiles').select('role').eq('id', callerUserId).single()
  if (callerProfile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = serverSupabaseServiceRole<Database>(event)
  const body = await readValidatedBody(event, (body) => inviteSchema.safeParse(body))

  if (!body.success) {
    const errorDetails = body.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Invalid input',
      message: errorDetails || 'Invalid input',
      data: body.error.flatten()
    })
  }

  const { email, full_name, role, school_id, redirectTo } = body.data
  const fullNameValue = full_name?.trim() || null

  const userMetadata: Record<string, any> = {}
  if (fullNameValue) {
    userMetadata.full_name = fullNameValue
  }

  // 1. Invite user
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: userMetadata,
    redirectTo: redirectTo || undefined
  })

  if (inviteError) {
    throw createError({ 
      statusCode: (inviteError as any).status || 400, 
      statusMessage: inviteError.message,
      message: inviteError.message
    })
  }

  const invitedUserId = inviteData.user.id

  // 2. Wait a little bit for the trigger to insert the profile
  await new Promise(resolve => setTimeout(resolve, 500))

  // 3. Update the profile with role and school_id
  const profileUpdates: Record<string, any> = {
    role,
    school_id: school_id || null
  }
  if (fullNameValue) {
    profileUpdates.full_name = fullNameValue
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', invitedUserId)
    .select('id')

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  }

  // Fallback if trigger was delayed and row wasn't updated yet
  if (!updatedProfile || updatedProfile.length === 0) {
    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: invitedUserId,
      full_name: fullNameValue || email,
      role,
      school_id: school_id || null
    })

    if (upsertError) {
      throw createError({ statusCode: 500, statusMessage: upsertError.message })
    }
  }

  return { success: true, user: inviteData.user }
})
