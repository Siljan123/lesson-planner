import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import { buildWorksheetDocx } from '~~/server/utils/worksheet-docExport'
import type { Worksheet } from '~~/app/types/worksheet'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { data: { user } } = await supabase.auth.getUser()
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const includeAnswerKey = query.includeAnswerKey !== 'false'

  const userId = (user as any)?.sub || user?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!id) {
    throw createError({ statusCode: 400, message: 'Invalid worksheet id' })
  }

  const { data: worksheet, error } = await supabase
    .from('worksheets')
    .select(`
      *,
      subject:subjects(name, code),
      grade:grade_levels(label),
      lesson_plan:lesson_plans(id, title)
    `)
    .eq('id', id)
    .single()

  if (error || !worksheet) {
    throw createError({ statusCode: 404, message: 'Worksheet not found' })
  }

  const type = query.type as 'worksheet' | 'tos' | 'both' | undefined
  const exportType = type || 'both'

  try {
    const buffer = await buildWorksheetDocx(worksheet as unknown as Worksheet, {
      includeAnswerKey,
      exportType
    })
    const sanitizedTitle = (worksheet.title || 'worksheet')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50)
    
    const suffix = exportType === 'tos' ? '_TOS' : exportType === 'worksheet' ? '_Worksheet' : ''
    const filename = `${sanitizedTitle}${suffix}.docx`

    setHeaders(event, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString()
    })

    return buffer
  } catch (err: any) {
    console.error('[worksheet/export] Failed to generate docx:', err)
    throw createError({
      statusCode: 500,
      message: `Failed to export document: ${err?.message || 'Unknown error'}`
    })
  }
})
