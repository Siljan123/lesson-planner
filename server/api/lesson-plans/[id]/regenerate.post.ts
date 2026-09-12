import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import { generateILAW } from '~~/server/utils/llm'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { data: { user } } = await supabase.auth.getUser()
  const id = getRouterParam(event, 'id')
  const body = (await readBody(event)) || {}

  const userId = (user as any)?.sub || user?.id;
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing lesson plan ID' })
  }

  // 1. Fetch current plan
  const { data: plan, error: planErr } = await supabase
    .from('lesson_plans')
    .select(`
      *,
      subject:subjects(id, name),
      grade:grade_levels(id, label)
    `)
    .eq('id', id)
    .single()

  if (planErr || !plan) {
    throw createError({ statusCode: 404, message: 'Lesson plan not found' })
  }

  // 2. Resolve parameters
  const subjectId = body.subject_id || plan.subject_id
  let subjectName = (plan.subject as any)?.name || 'Subject'
  if (body.subject_id && body.subject_id !== plan.subject_id) {
    const { data: s } = await supabase.from('subjects').select('name').eq('id', body.subject_id).single()
    if (s?.name) subjectName = s.name
  }

  const gradeLevelId = body.grade_level_id || plan.grade_level_id
  let gradeLabel = (plan.grade as any)?.label || 'Grade Level'
  if (body.grade_level_id && body.grade_level_id !== plan.grade_level_id) {
    const { data: g } = await supabase.from('grade_levels').select('label').eq('id', body.grade_level_id).single()
    if (g?.label) gradeLabel = g.label
  }

  const existingContent = (plan.content as any) || {}
  const topic = body.topic || existingContent.topic || existingContent.intentions?.topic || plan.title
  const competency = body.matatag_competency_code !== undefined ? body.matatag_competency_code : (plan.matatag_competency_code || '')
  const term = body.term || plan.term || 'term_1'
  const sessionDuration = body.session_duration || plan.session_duration || 'Day 1'
  const contentStandard = body.content_standard !== undefined ? body.content_standard : (plan.content_standard || existingContent.intentions?.content_standards || '')
  const performanceStandard = body.performance_standard !== undefined ? body.performance_standard : (plan.performance_standard || existingContent.intentions?.performance_standards || '')
  const mediumOfInstruction = body.medium_of_instruction ||
    existingContent.medium_of_instruction ||
    (plan.ai_use_declaration as any)?.medium_of_instruction ||
    'Filipino'
  const targetSection = body.section || 'all'
  const customInstructions = body.custom_instructions

  // 3. Call LLM generateILAW
  const result = await generateILAW({
    subject: subjectName,
    grade: gradeLabel,
    topic,
    competency,
    term,
    session_duration: sessionDuration,
    content_standard: contentStandard,
    performance_standard: performanceStandard,
    medium_of_instruction: mediumOfInstruction,
    section_to_regenerate: targetSection === 'all' ? undefined : targetSection,
    custom_instructions: customInstructions,
    existing_plan: existingContent,
  })

  const newContent = result.content

  let mergedContent: any = {}

  if (targetSection === 'all') {
    mergedContent = {
      ...newContent,
      topic
    }
  } else if (targetSection === 'intentions') {
    mergedContent = {
      ...existingContent,
      topic,
      intentions: {
        ...newContent.intentions,
        topic
      }
    }
  } else if (targetSection === 'learning_experience') {
    mergedContent = {
      ...existingContent,
      learning_experience: newContent.learning_experience
    }
  } else if (targetSection === 'assessing_learning') {
    mergedContent = {
      ...existingContent,
      assessing_learning: newContent.assessing_learning
    }
  } else if (targetSection === 'ways_forward') {
    mergedContent = {
      ...existingContent,
      ways_forward: newContent.ways_forward
    }
  } else if (targetSection === 'objectives_only') {
    mergedContent = {
      ...existingContent,
      intentions: {
        ...(existingContent.intentions || {}),
        learning_objectives: newContent.intentions?.learning_objectives || {},
        learning_objectives_per_session: newContent.intentions?.learning_objectives_per_session || []
      }
    }
  } else {
    mergedContent = {
      ...existingContent,
      ...newContent,
      topic
    }
  }

  // 4. Save history version snapshot
  try {
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
      content_snapshot: existingContent
    })
  } catch (verErr: any) {
    console.warn('[regenerate] Could not save version snapshot:', verErr?.message || verErr)
  }

  // 5. Update DB
  mergedContent.medium_of_instruction = mediumOfInstruction

  const updatePayload: Record<string, any> = {
    content: mergedContent,
    updated_at: new Date().toISOString(),
    ai_use_declaration: {
      tool: 'Gemini 3.6 Flash',
      medium_of_instruction: mediumOfInstruction,
      sections_ai_assisted:
        targetSection === 'all'
          ? ['Intentions', 'Learning Experience', 'Assessing Learning', 'Ways Forward']
          : [targetSection],
      teacher_verified: false,
      token_usage: result.usage
    }
  }

  if (body.title) updatePayload.title = body.title
  if (body.subject_id) updatePayload.subject_id = subjectId
  if (body.grade_level_id) updatePayload.grade_level_id = gradeLevelId
  if (body.term) updatePayload.term = term
  if (body.matatag_competency_code !== undefined) updatePayload.matatag_competency_code = competency
  if (body.content_standard !== undefined) updatePayload.content_standard = contentStandard
  if (body.performance_standard !== undefined) updatePayload.performance_standard = performanceStandard
  if (body.session_duration !== undefined) updatePayload.session_duration = sessionDuration

  const { data: updatedPlan, error: updateErr } = await supabase
    .from('lesson_plans')
    .update(updatePayload as any)
    .eq('id', id)
    .select(`
      *,
      subject:subjects(name),
      grade:grade_levels(label)
    `)
    .single()

  if (updateErr) {
    console.error('[regenerate] DB update error:', updateErr)
    throw createError({ statusCode: 500, message: `Failed to save regenerated plan: ${updateErr.message}` })
  }

  return {
    success: true,
    plan: {
      ...updatedPlan,
      topic
    },
    content: mergedContent,
    ai_declaration: updatePayload.ai_use_declaration
  }
})
