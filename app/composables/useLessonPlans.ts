export const useLessonPlans = () => {
  const fetchAll = async () => {
    return await $fetch('/api/lesson-plans')
  }

  const fetchStats = async () => {
    return await $fetch('/api/lesson-plans/stats')
  }

  const generatePlan = async (body: any) => {
    return await $fetch<{ id: string }>('/api/lesson-plans/generate', {
      method: 'POST',
      body
    })
  }

  const updatePlan = async (id: string, body: any) => {
    return await $fetch(`/api/lesson-plans/${id}`, {
      method: 'PUT',
      body
    })
  }

  const regeneratePlan = async (id: string, body: any = {}) => {
    return await $fetch<{ success: boolean; plan: any; content: any }>(`/api/lesson-plans/${id}/regenerate`, {
      method: 'POST',
      body
    })
  }

  return {
    fetchAll,
    fetchStats,
    generatePlan,
    updatePlan,
    regeneratePlan
  }
}
