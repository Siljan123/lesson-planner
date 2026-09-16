export const useReferenceData = () => {
  const fetchSubjects = async () => {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    return await $fetch('/api/subjects', { headers })
  }

  const fetchGrades = async () => {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    return await $fetch('/api/grade-levels', { headers })
  }

  const fetchPositions = async () => {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    return await $fetch('/api/positions', { headers })
  }

  const createSubject = async (payload: { name: string; code?: string }) => {
    return await $fetch<{ id: string; name: string; code: string; isExisting?: boolean }>('/api/subjects', {
      method: 'POST',
      body: payload
    })
  }

  return {
    fetchSubjects,
    createSubject,
    fetchGrades,
    fetchPositions
  }
}
