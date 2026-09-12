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

  return {
    fetchSubjects,
    fetchGrades,
    fetchPositions
  }
}
