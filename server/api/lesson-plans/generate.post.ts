import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  // Step 1: Read and validate body
  const body = await readBody(event)
  console.log('[generate] Step 1 - Body received:', JSON.stringify(body))

  if (!body.title || !body.subject_id || !body.grade_level_id || !body.term || !body.topic) {
    throw createError({ statusCode: 400, message: 'Missing required fields: title, subject_id, grade_level_id, term, topic' })
  }

  // Step 2: Auth - get user directly from supabase client
  const supabase = await serverSupabaseClient<Database>(event)
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[generate] Step 2 - User:', JSON.stringify(user?.id))

  const userId = (user as any)?.sub || user?.id;
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized - no user session found' })
  }

  // Step 3: Fetch reference data
  const { data: subject, error: subjectErr } = await supabase.from('subjects').select('name').eq('id', body.subject_id).single()
  console.log('[generate] Step 3a - Subject:', subject, 'Error:', subjectErr)

  const { data: grade, error: gradeErr } = await supabase.from('grade_levels').select('label').eq('id', body.grade_level_id).single()
  console.log('[generate] Step 3b - Grade:', grade, 'Error:', gradeErr)

  const { data: template, error: templateErr } = await supabase.from('templates').select('id, structure').eq('is_default', true).single()
  console.log('[generate] Step 3c - Template:', template?.id, 'Error:', templateErr)

  if (!subject || !grade || !template) {
    throw createError({
      statusCode: 400,
      message: `Invalid reference data. Subject: ${JSON.stringify(subjectErr)}, Grade: ${JSON.stringify(gradeErr)}, Template: ${JSON.stringify(templateErr)}`
    })
  }

  // Step 4: Generate content via LLM
  try {
    console.log('[generate] Step 4 - Calling LLM...')
    const result = await generateILAW({
      subject: subject.name,
      grade: grade.label,
      topic: body.topic,
      competency: body.matatag_competency_code || '',
      term: body.term,
      session_duration: body.session_duration || 'Day 1',
      content_standard: body.content_standard || undefined,
      performance_standard: body.performance_standard || undefined,
      medium_of_instruction: body.medium_of_instruction || 'Filipino',
      section_to_regenerate: body.section_to_regenerate || undefined,
      custom_instructions: body.custom_instructions || undefined,
      existing_plan: body.existing_plan || undefined,
    })
    
    const mediumOfInstruction = body.medium_of_instruction || 'Filipino'

    // Resolve position names for signatories
    let preparedByPosName = null
    let checkedByPosName = null
    let checkedBy2PosName = null

    if (body.prepared_by_position_id) {
      const { data: p1 } = await supabase.from('positions').select('name').eq('id', body.prepared_by_position_id).single()
      if (p1?.name) preparedByPosName = p1.name
    }
    if (body.checked_by_position_id) {
      const { data: p2 } = await supabase.from('positions').select('name').eq('id', body.checked_by_position_id).single()
      if (p2?.name) checkedByPosName = p2.name
    }
    if (body.checked_by_2_position_id) {
      const { data: p3 } = await supabase.from('positions').select('name').eq('id', body.checked_by_2_position_id).single()
      if (p3?.name) checkedBy2PosName = p3.name
    }

    const signatoryData = (body.school_name || body.prepared_by_name || body.checked_by_name || body.checked_by_2_name) ? {
      school_name: body.school_name || null,
      prepared_by_name: body.prepared_by_name || null,
      prepared_by_position_id: body.prepared_by_position_id || null,
      prepared_by_position: preparedByPosName ? { name: preparedByPosName } : null,
      checked_by_name: body.checked_by_name || null,
      checked_by_position_id: body.checked_by_position_id || null,
      checked_by_position: checkedByPosName ? { name: checkedByPosName } : null,
      checked_by_2_name: body.checked_by_2_name || null,
      checked_by_2_position_id: body.checked_by_2_position_id || null,
      checked_by_2_position: checkedBy2PosName ? { name: checkedBy2PosName } : null,
    } : null

    const generatedContent = {
      ...result.content,
      medium_of_instruction: mediumOfInstruction,
      signatory: signatoryData
    }
    const tokenUsage = result.usage
    console.log('[generate] Step 4 - LLM returned tokens:', tokenUsage)

    // Step 5: Insert into database
    console.log('[generate] Step 5 - Inserting into database...')
    const { data: newPlan, error: insertErr } = await supabase.from('lesson_plans').insert({
      owner_id: userId,
      subject_id: body.subject_id,
      grade_level_id: body.grade_level_id,
      template_id: template.id,
      title: body.title,
      term: body.term,
      matatag_competency_code: body.matatag_competency_code || null,
      content_standard: body.content_standard || null,
      performance_standard: body.performance_standard || null,
      session_duration: body.session_duration || null,
      status: 'draft',
      content: generatedContent,
      ai_use_declaration: {
        tool: "Gemini 3.6 Flash",
        medium_of_instruction: mediumOfInstruction,
        sections_ai_assisted: ["Intentions", "Learning Experience", "Assessing Learning", "Ways Forward"],
        teacher_verified: false,
        token_usage: tokenUsage
      }
    }).select().single()

    if (insertErr || !newPlan) {
      throw createError({ statusCode: 500, message: 'Database insert failed: ' + JSON.stringify(insertErr) })
    }

    // Step 6: Insert signatories if provided
    let signatory: any = signatoryData
    if (signatoryData) {
      const signatoryPayload: any = {
        lesson_plan_id: newPlan.id,
        school_name: body.school_name || null,
        prepared_by_name: body.prepared_by_name || null,
        prepared_by_position_id: body.prepared_by_position_id || null,
        checked_by_name: body.checked_by_name || null,
        checked_by_position_id: body.checked_by_position_id || null
      }
      if (body.checked_by_2_name) signatoryPayload.checked_by_2_name = body.checked_by_2_name
      if (body.checked_by_2_position_id) signatoryPayload.checked_by_2_position_id = body.checked_by_2_position_id

      const { data: sigData, error: sigErr } = await supabase
        .from('signatory_sections')
        .insert(signatoryPayload)
        .select('*, prepared_by_position:prepared_by_position_id(name), checked_by_position:checked_by_position_id(name)')
        .single()

      if (sigErr) {
        console.warn('[generate] Base or checked_by_2 insert error, falling back to base columns:', sigErr.message)
        delete signatoryPayload.checked_by_2_name
        delete signatoryPayload.checked_by_2_position_id
        await supabase.from('signatory_sections').insert(signatoryPayload)
      } else if (sigData) {
        signatory = {
          ...signatoryData,
          ...sigData,
          checked_by_2_name: sigData.checked_by_2_name || signatoryData.checked_by_2_name,
          checked_by_2_position_id: sigData.checked_by_2_position_id || signatoryData.checked_by_2_position_id,
          checked_by_2_position: signatoryData.checked_by_2_position
        }
      }
    }

    // Step 7: Auto-generate DOCX and save to generated_files
    try {
      console.log('[generate] Step 7 - Auto-generating DOCX for generated_files...')
      const enrichedPlan = {
        ...newPlan,
        subject: { name: subject.name },
        grade: { label: grade.label },
        signatory,
      }

      const buffer = await exportDocx(enrichedPlan as any)
      const fileName = `${userId}/${newPlan.id}/lesson_plan_${newPlan.id}.docx`

      const { error: uploadError } = await supabase.storage
        .from('exports')
        .upload(fileName, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true,
        })

      if (uploadError) {
        console.error('[generate] Step 7 - Storage upload failed:', uploadError.message)
      } else {
        await supabase.from('generated_files').insert({
          lesson_plan_id: newPlan.id,
          format: 'docx',
          storage_path: fileName,
        })
        console.log('[generate] Step 7 - DOCX saved to generated_files')
      }
    } catch (docErr: any) {
      // Non-fatal: lesson plan is already saved, just log the error
      console.error('[generate] Step 7 - Auto-DOCX generation failed (non-fatal):', docErr.message || docErr)
    }

    return { id: newPlan.id }

  } catch (err: any) {
    console.error('[generate] CAUGHT ERROR:', err.message || err)
    throw createError({ statusCode: err.statusCode || 500, message: err.message || 'Unknown generation error' })
  }
})
