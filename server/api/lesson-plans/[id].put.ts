import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { data: { user } } = await supabase.auth.getUser()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event) || {}

  const userId = (user as any)?.sub || user?.id;
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing lesson plan ID' })
  }

  // 1. Fetch current plan to check ownership and get content for snapshot
  const { data: current, error: fetchErr } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !current) {
    throw createError({ statusCode: 404, message: 'Lesson plan not found' })
  }

  // 2. Save previous version first for history with sequential integer version_number
  try {
    if (current.content) {
      const { data: latestVersion } = await supabase
        .from('lesson_plan_versions')
        .select('version_number')
        .eq('lesson_plan_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextVersion = ((latestVersion?.version_number as number) || 0) + 1

      await supabase.from('lesson_plan_versions').insert({
        lesson_plan_id: id,
        version_number: nextVersion,
        content_snapshot: current.content
      })
    }
  } catch (verErr: any) {
    console.warn('[update] Could not save version snapshot:', verErr?.message || verErr)
  }

  // 3. Prepare clean payload for lesson_plans table (only valid columns)
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString()
  }

  if (body.title !== undefined) updatePayload.title = body.title
  if (body.subject_id !== undefined) updatePayload.subject_id = body.subject_id
  if (body.grade_level_id !== undefined) updatePayload.grade_level_id = body.grade_level_id
  if (body.term !== undefined) updatePayload.term = body.term
  if (body.matatag_competency_code !== undefined) updatePayload.matatag_competency_code = body.matatag_competency_code
  if (body.status !== undefined) updatePayload.status = body.status
  if (body.content_standard !== undefined) updatePayload.content_standard = body.content_standard
  if (body.performance_standard !== undefined) updatePayload.performance_standard = body.performance_standard
  if (body.session_duration !== undefined) updatePayload.session_duration = body.session_duration
  if (body.ai_use_declaration !== undefined) updatePayload.ai_use_declaration = body.ai_use_declaration

  // Signatories and Topic stored inside content JSON
  let mergedSignatory: any = null
  if (body.signatory) {
    mergedSignatory = {
      school_name: body.signatory.school_name || null,
      prepared_by_name: body.signatory.prepared_by_name || null,
      prepared_by_position_id: body.signatory.prepared_by_position_id || null,
      prepared_by_position: body.signatory.prepared_by_position || null,
      checked_by_name: body.signatory.checked_by_name || null,
      checked_by_position_id: body.signatory.checked_by_position_id || null,
      checked_by_position: body.signatory.checked_by_position || null,
      checked_by_2_name: body.signatory.checked_by_2_name || null,
      checked_by_2_position_id: body.signatory.checked_by_2_position_id || null,
      checked_by_2_position: body.signatory.checked_by_2_position || null
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
        console.warn('[update] Could not fetch signatory positions:', err)
      }
    }
  }

  if (body.content !== undefined) {
    const content = typeof body.content === 'object' && body.content !== null ? { ...body.content } : body.content
    if (body.topic && typeof content === 'object') {
      content.topic = body.topic
      if (content.intentions && typeof content.intentions === 'object') {
        content.intentions.topic = body.topic
      }
    }
    if (mergedSignatory && typeof content === 'object') {
      content.signatory = mergedSignatory
    }
    updatePayload.content = content
  } else if (body.topic || mergedSignatory) {
    const content = current.content && typeof current.content === 'object' ? { ...(current.content as any) } : {}
    if (body.topic) {
      content.topic = body.topic
      if (content.intentions) {
        content.intentions = { ...content.intentions, topic: body.topic }
      }
    }
    if (mergedSignatory) {
      content.signatory = mergedSignatory
    }
    updatePayload.content = content
  }

  const { data, error } = await supabase
    .from('lesson_plans')
    .update(updatePayload as any)
    .eq('id', id)
    .select(`
      *,
      subject:subjects(name),
      grade:grade_levels(label)
    `)
    .single()

  if (error || !data) {
    console.error('[update] Error updating lesson plan:', error)
    throw createError({ 
      statusCode: 500, 
      message: error?.message ? `Failed to update lesson plan: ${error.message}` : 'Failed to update lesson plan' 
    })
  }

  // 4. Update signatories in signatory_sections table
  if (mergedSignatory) {
    try {
      const sigPayload: any = {
        lesson_plan_id: id,
        school_name: mergedSignatory.school_name,
        prepared_by_name: mergedSignatory.prepared_by_name,
        prepared_by_position_id: mergedSignatory.prepared_by_position_id,
        checked_by_name: mergedSignatory.checked_by_name,
        checked_by_position_id: mergedSignatory.checked_by_position_id
      }
      if (mergedSignatory.checked_by_2_name !== undefined) sigPayload.checked_by_2_name = mergedSignatory.checked_by_2_name
      if (mergedSignatory.checked_by_2_position_id !== undefined) sigPayload.checked_by_2_position_id = mergedSignatory.checked_by_2_position_id

      const { error: upsertErr } = await supabase.from('signatory_sections').upsert(sigPayload, { onConflict: 'lesson_plan_id' })
      if (upsertErr) {
        console.warn('[update] Upsert with checked_by_2 failed, retrying without checked_by_2:', upsertErr.message)
        delete sigPayload.checked_by_2_name
        delete sigPayload.checked_by_2_position_id
        await supabase.from('signatory_sections').upsert(sigPayload, { onConflict: 'lesson_plan_id' })
      }
    } catch (sigErr: any) {
      console.warn('[update] Could not save signatory:', sigErr?.message || sigErr)
    }
  }

  return {
    ...data,
    signatory: mergedSignatory || (data.content as any)?.signatory,
    topic: (data.content as any)?.topic || (data.content as any)?.intentions?.topic || ''
  }
})
