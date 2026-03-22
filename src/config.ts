// Dashboard 布局配置
// 这些值可以从环境变量或配置文件覆盖

export const LAYOUT = {
  SIDEBAR_WIDTH: 240,
  HEADER_HEIGHT: 56,
  STATS_BAR_HEIGHT: 140,
}

// Agent 颜色映射（当 identity.emoji 不可用时使用）
export const AGENT_COLORS: Record<string, string> = {
  'main': '#8b5cf6',
  'cfo': '#10b981',
  'errand': '#3b82f6',
  'coordinator': '#f97316',
  'security': '#f43f5e',
  'clerk': '#f59e0b',
  'family': '#06b6d4',
}

// 获取 Agent 颜色
export function getAgentColor(agentId: string): string {
  return AGENT_COLORS[agentId] || '#64748b'
}

// API 地址（自动检测）
export const API_BASE = typeof window !== 'undefined' 
  ? (window.location.port === '3000' ? 'http://localhost:3100' : window.location.origin)
  : 'http://localhost:3100'