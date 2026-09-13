export const useReferenceData = () => {
  const fetchSubjects = async () => {
    return await $fetch('/api/subjects')
  }

  const fetchGrades = async () => {
    return await $fetch('/api/grade-levels')
  }

  const fetchPositions = async () => {
    return await $fetch('/api/positions')
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
