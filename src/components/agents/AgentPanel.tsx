import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Cpu, MessageSquare, Clock, Star, X } from 'lucide-react'
import { fetchAgents, fetchMessagesStats, fetchMessagesToday } from '../../api/system'

type FilterType = 'all' | 'active' | 'idle'

const skillColors: Record<string, string> = {
  'self-improving': '#10b981', 'proactive-agent': '#8b5cf6', 'stock-market-pro': '#f59e0b', 'weather': '#06b6d4',
  'clawhub': '#3b82f6', 'clerk': '#f43f5e', 'obsidian': '#a855f7', 'healthcheck': '#ef4444',
  'clawsec-suite': '#f97316', 'eastmoney-financial-data': '#22c55e', 'eastmoney-financial-search': '#0ea5e9',
}

interface AgentPanelProps {
  onNavigate?: (tab: string) => void
}

export function AgentPanel({ onNavigate }: AgentPanelProps) {
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents })
  const { data: messageStats } = useQuery({ queryKey: ['messagesStats'], queryFn: fetchMessagesStats })
  const { data: todayMessages, refetch: refetchTodayMessages } = useQuery({ queryKey: ['messagesToday'], queryFn: fetchMessagesToday, enabled: false })
  const [filter, setFilter] = useState<FilterType>('all')
  const [showMessages, setShowMessages] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  
  // 组件挂载时滚动到顶部
  useEffect(() => {
    if (panelRef.current) {
      const mainContainer = panelRef.current.closest('main')
      if (mainContainer) {
        mainContainer.scrollTop = 0
      }
    }
  }, [])
  
  const stats = { total: agents?.length || 0, active: agents?.filter((a: any) => a.status === 'active').length || 0, idle: agents?.filter((a: any) => a.status === 'idle').length || 0, messages: messageStats?.total || 0 }
  const filteredAgents = agents?.filter((agent: any) => { switch (filter) { case 'active': return agent.status === 'active'; case 'idle': return agent.status === 'idle'; default: return true } })

  const handleMessagesClick = () => {
    refetchTodayMessages()
    setShowMessages(true)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* 固定在顶部的统计卡片 - 包含日期时间 */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: '240px',
        right: 0,
        zIndex: 100, 
        background: '#1e293b',
        padding: '12px 24px',
        borderBottom: '1px solid #334155'
      }}>
        {/* 日期时间栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '12px', color: '#10b981' }}>系统运行中</span>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard label="Agent 总数" value={stats.total} icon={<Activity />} color="#8b5cf6" active={filter === 'all'} onClick={() => setFilter('all')} />
          <StatCard label="活跃中" value={stats.active} icon={<Cpu />} color="#10b981" active={filter === 'active'} onClick={() => setFilter('active')} />
          <StatCard label="待命" value={stats.idle} icon={<Clock />} color="#f59e0b" active={filter === 'idle'} onClick={() => setFilter('idle')} />
          <StatCard label="今日消息" value={stats.messages} icon={<MessageSquare />} color="#3b82f6" onClick={handleMessagesClick} />
        </div>
      </div>
      
      {/* 占位符，防止内容被覆盖 */}
      <div style={{ height: '140px' }} />
      
      {/* 今日消息弹窗 */}
      {showMessages && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            background: '#1e293b', 
            borderRadius: '16px', 
            width: '90%', 
            maxWidth: '800px', 
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #334155'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #334155'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>💬 今日聊天</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                  {todayMessages?.date} · {todayMessages?.total || 0} 条消息
                </p>
              </div>
              <button 
                onClick={() => setShowMessages(false)}
                style={{ 
                  background: '#334155', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {todayMessages?.messages?.map((msg: any) => (
                <div key={msg.id} style={{ 
                  display: 'flex', 
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: msg.role === 'user' ? '#475569' : '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {msg.role === 'user' ? '👤' : msg.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, color: '#f8fafc', fontSize: '13px' }}>
                        {msg.role === 'user' ? '用户' : msg.agentName}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>{formatTime(msg.time)}</span>
                    </div>
                    <div style={{ 
                      color: '#94a3b8', 
                      fontSize: '14px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {msg.text.length > 300 ? msg.text.substring(0, 300) + '...' : msg.text}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!todayMessages?.messages || todayMessages.messages.length === 0) && (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                  暂无今日消息
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {filter !== 'all' && <div style={{ marginBottom: '16px', padding: '10px 16px', background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8', fontSize: '13px' }}>筛选：{filter === 'active' ? '活跃中' : '待命'}</span><button onClick={() => setFilter('all')} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>显示全部</button></div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', position: 'relative', zIndex: 1 }}>{filteredAgents?.map((agent: any, i: number) => <AgentCard key={agent.id} agent={agent} index={i} />)}</div>
    </div>
  )
}

function StatCard({ label, value, icon, color, active, onClick }: { label: string; value: number; icon: React.ReactNode; color: string; active?: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        cursor: 'pointer', 
        background: active ? `${color}15` : '#1e293b', 
        border: active ? `2px solid ${color}` : '1px solid #334155', 
        borderRadius: '12px', 
        padding: '20px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '80px'
      }}
    >
      <div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#f8fafc' }}>{value}</div>
      </div>
      <div style={{ 
        width: '48px', 
        height: '48px', 
        borderRadius: '12px', 
        background: `${color}15`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color,
        flexShrink: 0
      }}>
        {icon}
      </div>
    </div>
  )
}

function AgentCard({ agent, index }: { agent: any; index: number }) {
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4']
  const color = colors[index % colors.length]
  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = { idle: { bg: 'badge-warning', text: '待命', dot: 'status-idle' }, active: { bg: 'badge-success', text: '活跃', dot: 'status-online' }, error: { bg: 'badge-error', text: '错误', dot: 'status-error' } }
  const status = statusConfig[agent.status] || statusConfig.idle
  const tasks = agent.tasks || []
  const skills = agent.skills || []
  const hasManyTasks = tasks.length > 3
  
  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="avatar" style={{ background: color }}>{agent.emoji || agent.name.charAt(0)}</div><div><div style={{ fontWeight: 600, color: '#f8fafc' }}>{agent.name}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{agent.id}</div></div></div>
        <span className={`badge ${status.bg}`}><span className={`status-dot ${status.dot}`} style={{ marginRight: '4px' }} />{status.text}</span>
      </div>
      <div className="card-body">
        {/* 当前活动 */}
        {agent.status === 'active' && agent.currentActivity && (
          <div style={{ marginBottom: '12px', padding: '10px', background: '#10b98110', border: '1px solid #10b98130', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 500 }}>正在{agent.currentActivity.name}</span>
            </div>
            {agent.currentActivity.detail && (
              <div style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {agent.currentActivity.detail}
              </div>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #334155' }}><span style={{ color: '#64748b', fontSize: '13px' }}>模型</span><span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 500 }}>{agent.model?.replace('bailian/', '')}</span></div>
        
        {skills.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={10} /> Skills ({skills.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.slice(0, 4).map((skill: string) => {
                const skillColor = skillColors[skill] || '#64748b'
                const displayName = skill.replace(/_/g, ' ')
                return <span key={skill} style={{ padding: '3px 8px', borderRadius: '4px', background: `${skillColor}15`, border: `1px solid ${skillColor}30`, color: skillColor, fontSize: '11px', fontWeight: 500 }}>{displayName}</span>
              })}
              {skills.length > 4 && <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#334155', color: '#94a3b8', fontSize: '11px' }}>+{skills.length - 4}</span>}
            </div>
          </div>
        )}
        
        {tasks.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>定时任务 ({tasks.length})</span>
              {hasManyTasks && <span style={{ fontSize: '10px', color: '#64748b' }}>↕ 可滚动</span>}
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              maxHeight: hasManyTasks ? '120px' : 'none',
              overflowY: hasManyTasks ? 'auto' : 'visible',
              paddingRight: hasManyTasks ? '4px' : '0'
            }}>
              {tasks.map((task: any) => (
                <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#0f172a', borderRadius: '4px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>{task.name}</span>
                  <span style={{ color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{task.schedule}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {tasks.length === 0 && <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>暂无任务</div>}
      </div>
    </div>
  )
}