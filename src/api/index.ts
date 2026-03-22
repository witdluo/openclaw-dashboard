import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 获取系统状态
export async function fetchSystemStatus() {
  const response = await api.get('/status')
  return response.data
}

// 获取 Agents 列表
export async function fetchAgents() {
  const response = await api.get('/agents')
  return response.data
}

// 获取 Agent 状态
export async function fetchAgentStatus(agentId: string) {
  const response = await api.get(`/agents/${agentId}/status`)
  return response.data
}

// 获取 Cron 任务列表
export async function fetchCronJobs() {
  const response = await api.get('/cron/jobs')
  return response.data
}

// 获取 Cron 任务执行历史
export async function fetchCronRuns(jobId: string) {
  const response = await api.get(`/cron/jobs/${jobId}/runs`)
  return response.data
}

// 手动触发 Cron 任务
export async function triggerCronJob(jobId: string) {
  const response = await api.post(`/cron/jobs/${jobId}/run`)
  return response.data
}

// 获取消息记录
export async function fetchMessages(limit = 50) {
  const response = await api.get(`/messages?limit=${limit}`)
  return response.data
}

// 获取错误日志
export async function fetchErrorLogs(limit = 100) {
  const response = await api.get(`/logs/errors?limit=${limit}`)
  return response.data
}

// 获取资源使用情况
export async function fetchResourceUsage() {
  const response = await api.get('/resources')
  return response.data
}

export default api