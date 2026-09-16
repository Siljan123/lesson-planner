export const useLessonPlans = () => {
  const fetchAll = async () => {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    return await $fetch('/api/lesson-plans', { headers })
  }

  const fetchStats = async () => {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    return await $fetch('/api/lesson-plans/stats', { headers })
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

  const deletePlan = async (id: string) => {
    return await $fetch(`/api/lesson-plans/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    fetchAll,
    fetchStats,
    generatePlan,
    updatePlan,
    regeneratePlan,
    deletePlan
  }
}
