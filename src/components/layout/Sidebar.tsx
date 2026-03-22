import { useEffect, useState } from 'react'
import { Users, Clock, Activity, MessageSquare, FileText, MessageCircle, Zap } from 'lucide-react'

interface SidebarProps { activeTab: string; onTabChange: (tab: string) => void }

const menuItems = [
  { id: 'agents', label: 'Agents', icon: Users, color: '#8b5cf6' },
  { id: 'cron', label: '定时任务', icon: Clock, color: '#3b82f6' },
  { id: 'resources', label: '资源监控', icon: Activity, color: '#10b981' },
  { id: 'messages', label: '消息记录', icon: MessageSquare, color: '#f59e0b' },
  { id: 'logs', label: '错误日志', icon: FileText, color: '#f43f5e' },
  { id: 'chat', label: '聊天', icon: MessageCircle, color: '#06b6d4' },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [stats, setStats] = useState({ agentCount: 7, cronCount: 20, activeAgents: 2, model: 'glm-5' })
  
  useEffect(() => {
    // 从API获取数据
    fetch('http://localhost:3100/api/health')
      .then(res => res.json())
      .then(data => {
        setStats(prev => ({ ...prev, model: data.config?.defaultModel || 'glm-5' }))
      })
      .catch(() => {})
    
    fetch('http://localhost:3100/api/agents')
      .then(res => res.json())
      .then(data => {
        const activeCount = data.filter((a: any) => a.status === 'active').length
        setStats(prev => ({ ...prev, agentCount: data.length, activeAgents: activeCount }))
      })
      .catch(() => {})
    
    fetch('http://localhost:3100/api/cron')
      .then(res => res.json())
      .then(data => {
        setStats(prev => ({ ...prev, cronCount: data.length }))
      })
      .catch(() => {})
  }, [])
  
  return (
    <aside style={{ width: '240px', background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ height: '56px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🦞</div>
        <div style={{ fontWeight: 600, fontSize: '15px', color: '#f8fafc' }}>OpenClaw</div>
      </div>
      <div style={{ padding: '12px', borderBottom: '1px solid #334155' }}>
        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Zap size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>控制面板</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{stats.agentCount}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Agents</div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{stats.cronCount}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>任务</div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>{stats.activeAgents} 活跃</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>状态</div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{stats.model}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>默认模型</div>
            </div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        <div style={{ fontSize: '10px', color: '#64748b', padding: '0 8px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>菜单</div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button key={item.id} onClick={() => onTabChange(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '2px', borderRadius: '6px', border: 'none',
              background: isActive ? item.color : 'transparent', color: isActive ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: isActive ? 500 : 400
            }}><item.icon size={16} />{item.label}</button>
          )
        })}
      </nav>
      <div style={{ padding: '12px', borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#0f172a', borderRadius: '6px' }}>
          <span className="status-dot status-online" />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>系统运行中</span>
        </div>
      </div>
    </aside>
  )
}