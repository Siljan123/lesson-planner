import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import { generateWorksheetContent } from '~~/server/utils/worksheet-llm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.title || !body.subject_id || !body.grade_level_id || !body.topic) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: title, subject_id, grade_level_id, topic'
    })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  const { data: { user } } = await supabase.auth.getUser()

  const userId = (user as any)?.sub || user?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized - no user session found' })
  }

  // Reference lookups
  const { data: subject, error: subjectErr } = await supabase
    .from('subjects')
    .select('name, code')
    .eq('id', body.subject_id)
    .single()

  const { data: grade, error: gradeErr } = await supabase
    .from('grade_levels')
    .select('label')
    .eq('id', body.grade_level_id)
    .single()

  if (!subject || !grade) {
    throw createError({
      statusCode: 400,
      message: `Invalid reference data. Subject: ${JSON.stringify(subjectErr)}, Grade: ${JSON.stringify(gradeErr)}`
    })
  }

  // Optional aligned lesson plan context
  let lessonPlanContext = null
  if (body.lesson_plan_id) {
    const { data: lp } = await supabase
      .from('lesson_plans')
      .select('title, content')
      .eq('id', body.lesson_plan_id)
      .single()
    if (lp) {
      lessonPlanContext = { title: lp.title, content: lp.content }
    }
  }

  // Call LLM
  const mediumOfInstruction = body.medium_of_instruction || 'English'
  const result = await generateWorksheetContent({
    subject: subject.name,
    grade: grade.label,
    topic: body.topic,
    competency: body.target_competency || '',
    term: body.term || 'term_1',
    medium_of_instruction: mediumOfInstruction,
    custom_instructions: body.custom_instructions || undefined,
    lesson_plan_context: lessonPlanContext
  })

  // Insert into DB
  const { data: worksheet, error: insertErr } = await supabase
    .from('worksheets')
    .insert({
      owner_id: userId,
      subject_id: body.subject_id,
      grade_level_id: body.grade_level_id,
      lesson_plan_id: body.lesson_plan_id || null,
      title: body.title,
      topic: body.topic,
      term: body.term || 'term_1',
      target_competency: body.target_competency || null,
      medium_of_instruction: mediumOfInstruction,
      status: 'draft',
      content: result.content as any,
      ai_use_declaration: {
        tool: 'Gemini 3.6 Flash',
        medium_of_instruction: mediumOfInstruction,
        model: 'gemini-3.6-flash',
        teacher_verified: false,
        token_usage: result.usage || null
      } as any
    })
    .select('id')
    .single()

  if (insertErr || !worksheet) {
    console.error('[worksheets/generate] Insert error:', insertErr)
    throw createError({
      statusCode: 500,
      message: `Failed to save worksheet: ${insertErr?.message}`
    })
  }

  return {
    id: worksheet.id,
    success: true
  }
})
