import {toast} from 'vue-sonner'

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
    const res = await $fetch<{ id: string }>('/api/lesson-plans/generate', {
      method: 'POST',
      body
    })
    toast.success('Lesson plan generated successfully!')
    return res
  }

  const updatePlan = async (id: string, body: any) => {
    const res = await $fetch(`/api/lesson-plans/${id}`, {
      method: 'PUT',
      body
    })
    toast.success('Lesson plan updated successfully!')
    return res
  }

  const regeneratePlan = async (id: string, body: any = {}) => {
    const res = await $fetch<{ success: boolean; plan: any; content: any }>(`/api/lesson-plans/${id}/regenerate`, {
      method: 'POST',
      body
    })
    toast.success('Lesson plan regenerated successfully!')
    return res
  }

  const deletePlan = async (id: string) => {
    const res = await $fetch(`/api/lesson-plans/${id}`, {
      method: 'DELETE'
    })
    toast.success('Lesson plan deleted successfully!')
    return res
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
