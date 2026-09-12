import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<any>(event)
  const { data: { user } } = await supabase.auth.getUser()
  const id = getRouterParam(event, 'id')

  const userId = (user as any)?.sub || user?.id;
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { data: plan, error } = await supabase
    .from('lesson_plans')
    .select(`
      *,
      subject:subjects(name),
      grade:grade_levels(label),
      signatory:signatory_sections(
        *,
        prepared_by_position:positions!signatory_sections_prepared_by_position_id_fkey(name),
        checked_by_position:positions!signatory_sections_checked_by_position_id_fkey(name)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !plan) {
    throw createError({ statusCode: 404, message: 'Lesson plan not found' })
  }

  // Fetch version history
  const { data: versions } = await supabase
    .from('lesson_plan_versions')
    .select('*')
    .eq('lesson_plan_id', id)
    .order('created_at', { ascending: false })

  const dbSignatory = Array.isArray(plan.signatory) ? (plan.signatory[0] || null) : (plan.signatory || null)
  const contentSignatory = (plan.content as any)?.signatory || {}

  let mergedSignatory: any = null
  if (dbSignatory || Object.keys(contentSignatory).length > 0) {
    mergedSignatory = {
      ...(dbSignatory || {}),
      ...contentSignatory,
      school_name: dbSignatory?.school_name || contentSignatory.school_name || null,
      prepared_by_name: dbSignatory?.prepared_by_name || contentSignatory.prepared_by_name || null,
      prepared_by_position_id: dbSignatory?.prepared_by_position_id || contentSignatory.prepared_by_position_id || null,
      prepared_by_position: dbSignatory?.prepared_by_position || contentSignatory.prepared_by_position || null,
      checked_by_name: dbSignatory?.checked_by_name || contentSignatory.checked_by_name || null,
      checked_by_position_id: dbSignatory?.checked_by_position_id || contentSignatory.checked_by_position_id || null,
      checked_by_position: dbSignatory?.checked_by_position || contentSignatory.checked_by_position || null,
      checked_by_2_name: dbSignatory?.checked_by_2_name || contentSignatory.checked_by_2_name || null,
      checked_by_2_position_id: dbSignatory?.checked_by_2_position_id || contentSignatory.checked_by_2_position_id || null,
      checked_by_2_position: dbSignatory?.checked_by_2_position || contentSignatory.checked_by_2_position || null,
    }

    const posIds = [
      { key: 'prepared_by_position', id: mergedSignatory.prepared_by_position_id },
      { key: 'checked_by_position', id: mergedSignatory.checked_by_position_id },
      { key: 'checked_by_2_position', id: mergedSignatory.checked_by_2_position_id }
    ].filter(item => item.id && !mergedSignatory[item.key]?.name)

    if (posIds.length > 0) {
      try {
        const { data: positions } = await supabase
          .from('positions')
          .select('id, name')
          .in('id', posIds.map(p => p.id))

        if (positions) {
          for (const item of posIds) {
            const found = positions.find((p: any) => p.id === item.id)
            if (found) {
              mergedSignatory[item.key] = { name: found.name }
            }
          }
        }
      } catch (err) {
        console.warn('[get] Could not fetch signatory positions:', err)
      }
    }
  }

  return {
    plan: {
      ...plan,
      signatory: mergedSignatory,
      topic: (plan.content as any)?.topic || (plan.content as any)?.intentions?.topic || ''
    },
    versions: versions || []
  }
})
