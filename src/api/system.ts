// API utility - 对接 OpenClaw 真实数据
// API 地址自动检测：开发环境用 localhost:3100，生产环境用当前域名
const API_BASE = typeof window !== 'undefined' 
  ? (window.location.port === '3000' ? 'http://localhost:3100' : window.location.origin)
  : 'http://localhost:3100'

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/api/health`)
  return res.json()
}

export async function fetchAgents() {
  const res = await fetch(`${API_BASE}/api/agents`)
  const agents = await res.json()
  
  // 获取 cron 任务来分配给 agents
  const cronRes = await fetch(`${API_BASE}/api/cron`)
  const cronJobs = await cronRes.json()
  
  // 将任务分配给对应的 agent
  return agents.map((agent: any) => ({
    ...agent,
    tasks: cronJobs.filter((job: any) => job.agentId === agent.id).map((job: any) => ({
      id: job.id,
      name: job.name,
      schedule: formatSchedule(job.schedule),
      status: job.enabled ? 'idle' : 'disabled'
    }))
  }))
}

export async function fetchCronJobs() {
  const res = await fetch(`${API_BASE}/api/cron`)
  const jobs = await res.json()
  
  // 格式化并按 nextRun 排序（后端已排序）
  return jobs.map((job: any) => ({
    ...job,
    scheduleFormatted: formatSchedule(job.schedule)
  }))
}

export async function fetchResourceUsage() {
  const res = await fetch(`${API_BASE}/api/resources`)
  return res.json()
}

export async function fetchTopProcesses() {
  const res = await fetch(`${API_BASE}/api/processes`)
  return res.json()
}

export async function fetchLogs() {
  const res = await fetch(`${API_BASE}/api/logs`)
  return res.json()
}

export async function fetchMessagesAll() {
  const res = await fetch(`${API_BASE}/api/messages/all`)
  return res.json()
}

export async function fetchMessagesToday() {
  const res = await fetch(`${API_BASE}/api/messages/today`)
  return res.json()
}

export async function fetchMessagesStats() {
  const res = await fetch(`${API_BASE}/api/messages/stats`)
  return res.json()
}

export async function fetchMessages() {
  // 暂时返回模拟数据，后续可对接消息存储
  return [
    { id: '1', channel: 'dingtalk', direction: 'out', content: '📰 新闻简报 - 2026年03月22日', time: new Date().toISOString(), status: 'delivered' },
    { id: '2', channel: 'dingtalk', direction: 'in', content: '执行一次', time: new Date(Date.now() - 3600000).toISOString(), status: 'read' },
  ]
}

export async function fetchErrorLogs() {
  // 暂时返回模拟数据，后续可对接日志存储
  return [
    { id: '1', level: 'error', message: 'TrendRadar 进程超时被终止', time: new Date().toISOString(), source: 'cron' },
    { id: '2', level: 'warning', message: 'Chrome 浏览器进程未完全关闭', time: new Date(Date.now() - 3600000).toISOString(), source: 'errand' },
  ]
}

// 格式化 cron 表达式
function formatSchedule(expr: string): string {
  if (!expr) return '未知'
  
  // 每 N 分钟
  if (expr.startsWith('every')) {
    const match = expr.match(/every (\d+)?(min|h)/)
    if (match) {
      const num = match[1] || '1'
      const unit = match[2] === 'h' ? '小时' : '分钟'
      return `每 ${num} ${unit}`
    }
    return expr
  }
  
  // 解析 cron 表达式
  const parts = expr.split(' ')
  if (parts.length !== 5) return expr
  
  const [min, hour, day, month, weekday] = parts
  
  // 每天
  if (day === '*' && month === '*' && weekday === '*') {
    if (min === '0') {
      return `每天 ${hour.padStart(2, '0')}:00`
    }
    return `每天 ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
  }
  
  // 每周
  if (weekday !== '*') {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${days[parseInt(weekday)]} ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
  }
  
  // 每月
  if (day !== '*') {
    return `每月${day}日 ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
  }
  
  return expr
}