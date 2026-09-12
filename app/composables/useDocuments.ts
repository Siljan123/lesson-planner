export const useDocuments = () => {
  const fetchDocuments = async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : ''
    return await $fetch(`/api/documents${query}`)
  }

  const getDownloadUrl = async (path: string) => {
    return await $fetch('/api/documents/download', {
      method: 'POST',
      body: { path }
    })
  }

  return {
    fetchDocuments,
    getDownloadUrl
  }
}
