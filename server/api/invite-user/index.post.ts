import { serverSupabaseServiceRole, serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'teacher']),
  school_id: z.string().optional().nullable(),
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
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const { email, full_name, role, school_id } = body.data

  // 1. Invite user
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name }
  })

  if (inviteError) {
    throw createError({ statusCode: 500, statusMessage: inviteError.message })
  }

  const invitedUserId = inviteData.user.id

  // 2. Wait a little bit for the trigger to insert the profile
  await new Promise(resolve => setTimeout(resolve, 500))

  // 3. Update the profile with role and school_id
  const { error: updateError } = await supabase.from('profiles').update({
    role,
    school_id: school_id || null
  }).eq('id', invitedUserId)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  }

  return { success: true, user: inviteData.user }
})
