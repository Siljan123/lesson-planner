import type { Worksheet } from '~/types/worksheet'

export const useWorksheets = () => {
  const fetchAll = async () => {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    return await $fetch<Worksheet[]>('/api/worksheets', { headers })
  }

  const fetchById = async (id: string) => {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    return await $fetch<{ worksheet: Worksheet }>(`/api/worksheets/${id}`, { headers })
  }

  const generateWorksheet = async (body: any) => {
    return await $fetch<{ id: string; success: boolean }>('/api/worksheets/generate', {
      method: 'POST',
      body
    })
  }

  const updateWorksheet = async (id: string, body: any) => {
    return await $fetch<{ worksheet: Worksheet }>(`/api/worksheets/${id}`, {
      method: 'PUT',
      body
    })
  }

  const deleteWorksheet = async (id: string) => {
    return await $fetch(`/api/worksheets/${id}`, {
      method: 'DELETE'
    })
  }

  const downloadExport = (id: string, title = 'worksheet', includeAnswerKey = true, exportType = 'both') => {
    const url = `/api/worksheets/${id}/export?includeAnswerKey=${includeAnswerKey}&type=${exportType}`
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return {
    fetchAll,
    fetchById,
    generateWorksheet,
    updateWorksheet,
    deleteWorksheet,
    downloadExport
  }
}
