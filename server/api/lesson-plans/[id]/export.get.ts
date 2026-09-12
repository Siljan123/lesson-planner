import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { data: { user } } = await supabase.auth.getUser()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Invalid lesson plan id' })
  }

  const query = getQuery(event)
  const format = query.format as 'docx' | 'pptx'

  const userId = (user as any)?.sub || user?.id;
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (format !== 'docx' && format !== 'pptx') {
    throw createError({ statusCode: 400, message: 'Invalid format requested' })
  }

  // Fetch the lesson plan
  const { data: plan, error } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !plan) {
    throw createError({ statusCode: 404, message: 'Lesson plan not found' })
  }

  // Fetch signatory data if exists
  const { data: signatory } = await supabase
    .from('signatory_sections')
    .select('*, prepared_by_position:prepared_by_position_id(name), checked_by_position:checked_by_position_id(name)')
    .eq('lesson_plan_id', id)
    .maybeSingle()

  const contentSignatory = (plan.content as any)?.signatory || {}
  let mergedSignatory: any = null

  if (signatory || Object.keys(contentSignatory).length > 0) {
    mergedSignatory = {
      ...(signatory || {}),
      ...contentSignatory,
      school_name: signatory?.school_name || contentSignatory.school_name || null,
      prepared_by_name: signatory?.prepared_by_name || contentSignatory.prepared_by_name || null,
      prepared_by_position: signatory?.prepared_by_position || contentSignatory.prepared_by_position || null,
      checked_by_name: signatory?.checked_by_name || contentSignatory.checked_by_name || null,
      checked_by_position: signatory?.checked_by_position || contentSignatory.checked_by_position || null,
      checked_by_2_name: (signatory as any)?.checked_by_2_name || contentSignatory.checked_by_2_name || null,
      checked_by_2_position_id: (signatory as any)?.checked_by_2_position_id || contentSignatory.checked_by_2_position_id || null,
      checked_by_2_position: (signatory as any)?.checked_by_2_position || contentSignatory.checked_by_2_position || null,
    }

    const posIds = [
      { key: 'prepared_by_position', id: mergedSignatory.prepared_by_position_id || contentSignatory.prepared_by_position_id },
      { key: 'checked_by_position', id: mergedSignatory.checked_by_position_id || contentSignatory.checked_by_position_id },
      { key: 'checked_by_2_position', id: mergedSignatory.checked_by_2_position_id || contentSignatory.checked_by_2_position_id }
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
        console.warn('[export] Could not fetch signatory positions:', err)
      }
    }
  }

  // Fetch related reference data
  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', plan.subject_id)
    .single()

  const { data: grade } = await supabase
    .from('grade_levels')
    .select('label')
    .eq('id', plan.grade_level_id)
    .single()

  // Attach reference data to plan for export
  const enrichedPlan = {
    ...plan,
    subject,
    grade,
    signatory: mergedSignatory,
  }

  // Generate the file buffer
  let buffer: Buffer
  let mimeType: string
  let ext: string

  const lang = (query.lang as string) ||
    (query.medium_of_instruction as string) ||
    (plan.content as any)?.medium_of_instruction ||
    (plan.ai_use_declaration as any)?.medium_of_instruction

  if (format === 'docx') {
    buffer = await exportDocx(enrichedPlan as any, lang)
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ext = 'docx'
  } else {
    buffer = await exportPptx(enrichedPlan as any, lang)
    mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ext = 'pptx'
  }

  // Upload to Supabase Storage
  const fileName = `${userId}/${id}/lesson_plan_${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('exports')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true, // overwrite if re-exported
    })

  if (uploadError) {
    console.error('[export] Storage upload failed:', uploadError.message)
    // Still return the file even if storage upload fails
  } else {
    // Record in generated_files table (upsert to avoid duplicates for same plan+format)
    // First check if a record already exists
    const { data: existingFile } = await supabase
      .from('generated_files')
      .select('id')
      .eq('lesson_plan_id', id)
      .eq('format', format)
      .single()

    if (existingFile) {
      // Update existing record
      await supabase
        .from('generated_files')
        .update({
          storage_path: fileName,
          created_at: new Date().toISOString(),
        })
        .eq('id', existingFile.id)
    } else {
      // Insert new record
      await supabase
        .from('generated_files')
        .insert({
          lesson_plan_id: id,
          format,
          storage_path: fileName,
        })
    }

    // Update lesson plan status to 'exported'
    await supabase
      .from('lesson_plans')
      .update({ status: 'exported' })
      .eq('id', id)
  }

  // Return the file as a download
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="lesson_plan_${id}.${ext}"`)
  setResponseHeader(event, 'Content-Type', mimeType)

  return buffer
})
