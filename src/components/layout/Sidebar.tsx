import { useEffect, useState } from 'react'
import { Users, Clock, Activity, MessageSquare, FileText, MessageCircle, Zap, Globe } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface SidebarProps { activeTab: string; onTabChange: (tab: string) => void }

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { lang, setLang, t } = useLanguage()
  const [stats, setStats] = useState({ agentCount: 7, activeAgents: 2 })

  useEffect(() => {
    fetch('http://localhost:3100/api/agents')
      .then(res => res.json())
      .then(data => {
        const activeCount = data.filter((a: any) => a.status === 'active').length
        setStats({ agentCount: data.length, activeAgents: activeCount })
      })
      .catch(() => {})
  }, [])

  const menuItems = [
    { id: 'agents', label: t.sidebar.agents, icon: Users, color: '#8b5cf6' },
    { id: 'cron', label: t.sidebar.cron, icon: Clock, color: '#3b82f6' },
    { id: 'resources', label: t.sidebar.resources, icon: Activity, color: '#10b981' },
    { id: 'messages', label: t.sidebar.messages, icon: MessageSquare, color: '#f59e0b' },
    { id: 'logs', label: t.sidebar.logs, icon: FileText, color: '#f43f5e' },
    { id: 'chat', label: t.sidebar.chat, icon: MessageCircle, color: '#06b6d4' },
  ]

  return (
    <aside style={{ width: 200, display: 'flex', flexDirection: 'column', background: '#1e293b', borderRight: '1px solid #334155', height: '100vh' }}>
      <div style={{ height: 56, borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🦞</div>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#f8fafc' }}>OpenClaw Dashboard</div>
      </div>
      
      {/* 语言切换按钮 - 控制面板上方 */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #334155' }}>
        <button 
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          style={{ 
            width: '100%',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px', 
            padding: '10px', 
            background: '#0f172a', 
            border: '1px solid #334155', 
            borderRadius: '8px', 
            color: '#f8fafc', 
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          <Globe size={16} />
          <span>{lang === 'zh' ? 'English' : '中文'}</span>
        </button>
      </div>
      
      <div style={{ padding: 12, borderBottom: '1px solid #334155' }}>
        <div style={{ background: '#0f172a', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Zap size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.sidebar.controlPanel}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{stats.agentCount}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{t.stats.agents}</div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{stats.activeAgents}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{t.stats.active}</div>
            </div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        <div style={{ fontSize: 10, color: '#64748b', padding: '0 8px', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.sidebar.menu}</div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button key={item.id} onClick={() => onTabChange(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 2, borderRadius: 6,
              border: isActive ? '2px solid ' + item.color : '1px solid #334155',
              background: isActive ? item.color + '15' : '#1e293b', cursor: 'pointer', textAlign: 'left'
            }}>
              <item.icon size={16} style={{ color: isActive ? item.color : '#94a3b8' }} />
              <span style={{ color: isActive ? '#f8fafc' : '#94a3b8', fontSize: 13, fontWeight: isActive ? 500 : 400 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div style={{ padding: 12, borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: '#0f172a', borderRadius: 6 }}>
          <span className="status-dot status-online" />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.sidebar.systemRunning}</span>
        </div>
      </div>
    </aside>
  )
}