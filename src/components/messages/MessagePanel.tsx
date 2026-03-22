import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Send, Inbox } from 'lucide-react'
import { fetchMessagesAll, fetchMessagesStats } from '../../api/system'

export function MessagePanel() {
  const panelRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<'all' | 'today' | 'user' | 'assistant'>('all')
  
  // 组件挂载时滚动到顶部
  useEffect(() => {
    if (panelRef.current) {
      const mainContainer = panelRef.current.closest('main')
      if (mainContainer) {
        mainContainer.scrollTop = 0
      }
    }
  }, [])
  
  const { data: messagesData } = useQuery({ queryKey: ['messagesAll'], queryFn: fetchMessagesAll })
  const { data: statsData } = useQuery({ queryKey: ['messagesStats'], queryFn: fetchMessagesStats })
  
  const messages = messagesData?.messages || []
  const totalMessages = messagesData?.total || 0
  const todayMessages = statsData?.total || 0
  
  // 筛选消息
  const today = new Date().toISOString().split('T')[0]
  const filteredMessages = messages.filter((msg: any) => {
    if (filter === 'today') {
      const msgDate = (msg.time || '').split('T')[0]
      return msgDate === today
    }
    if (filter === 'user') return msg.role === 'user'
    if (filter === 'assistant') return msg.role === 'assistant'
    return true
  })
  
  const userCount = messages.filter((m: any) => m.role === 'user').length
  const assistantCount = messages.filter((m: any) => m.role === 'assistant').length
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    })
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
          <StatCard label="全部消息" value={totalMessages} color="#8b5cf6" active={filter === 'all'} onClick={() => setFilter('all')} />
          <StatCard label="今日消息" value={todayMessages} color="#3b82f6" active={filter === 'today'} onClick={() => setFilter('today')} />
          <StatCard label="用户消息" value={userCount} color="#f59e0b" active={filter === 'user'} onClick={() => setFilter('user')} />
          <StatCard label="助手回复" value={assistantCount} color="#10b981" active={filter === 'assistant'} onClick={() => setFilter('assistant')} />
        </div>
      </div>
      
      {/* 占位符，防止内容被覆盖 */}
      <div style={{ height: '140px' }} />
      
      {/* 消息列表 */}
      <div className="card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>消息记录</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>共 {filteredMessages.length} 条</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '600px', overflowY: 'auto' }}>
          {filteredMessages.map((msg: any) => (
            <div key={msg.id} style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              transition: 'background 0.2s'
            }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: msg.role === 'user' ? '#475569' : '#3b82f615',
                flexShrink: 0
              }}>
                {msg.role === 'user' 
                  ? <span style={{ fontSize: '16px' }}>👤</span>
                  : <span style={{ fontSize: '16px' }}>{msg.emoji}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, color: '#f8fafc', fontSize: '13px' }}>
                    {msg.role === 'user' ? '用户' : msg.agentName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{formatTime(msg.time)}</span>
                </div>
                <p style={{ 
                  color: '#94a3b8', 
                  fontSize: '14px', 
                  margin: 0,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.text.length > 200 ? msg.text.substring(0, 200) + '...' : msg.text}
                </p>
              </div>
            </div>
          ))}
          
          {filteredMessages.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              暂无消息记录
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, active, onClick }: { label: string; value: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        cursor: 'pointer', 
        background: active ? `${color}15` : '#0f172a', 
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
        <MessageSquare size={20} />
      </div>
    </div>
  )
}