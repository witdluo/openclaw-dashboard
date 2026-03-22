import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Info, XCircle } from 'lucide-react'
import { fetchLogs } from '../../api/system'

const levelConfig = {
  error: { color: '#ef4444', bg: '#ef444415', icon: XCircle },
  warning: { color: '#f59e0b', bg: '#f59e0b15', icon: AlertTriangle },
  info: { color: '#3b82f6', bg: '#3b82f615', icon: Info },
}

export function LogPanel() {
  const panelRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')
  
  // 组件挂载时滚动到顶部
  useEffect(() => {
    if (panelRef.current) {
      const mainContainer = panelRef.current.closest('main')
      if (mainContainer) {
        mainContainer.scrollTop = 0
      }
    }
  }, [])
  
  const { data: logsData } = useQuery({ queryKey: ['logs'], queryFn: fetchLogs })
  
  const logs = logsData?.logs || []
  const errorCount = logsData?.errorCount || 0
  const warningCount = logsData?.warningCount || 0
  const infoCount = logsData?.infoCount || 0
  
  // 筛选日志
  const filteredLogs = logs.filter((log: any) => {
    if (filter === 'error') return log.level === 'error'
    if (filter === 'warning') return log.level === 'warning'
    if (filter === 'info') return log.level === 'info'
    return true
  })
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
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
          <StatCard label="全部" value={logs.length} color="#8b5cf6" active={filter === 'all'} onClick={() => setFilter('all')} />
          <StatCard label="错误" value={errorCount} color="#ef4444" active={filter === 'error'} onClick={() => setFilter('error')} />
          <StatCard label="警告" value={warningCount} color="#f59e0b" active={filter === 'warning'} onClick={() => setFilter('warning')} />
          <StatCard label="信息" value={infoCount} color="#3b82f6" active={filter === 'info'} onClick={() => setFilter('info')} />
        </div>
      </div>
      
      {/* 占位符，防止内容被覆盖 */}
      <div style={{ height: '140px' }} />
      
      {/* 日志列表 */}
      <div className="card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>日志列表</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>共 {filteredLogs.length} 条</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '600px', overflowY: 'auto' }}>
          {filteredLogs.map((log: any) => {
            const config = levelConfig[log.level as keyof typeof levelConfig] || levelConfig.info
            const Icon = config.icon
            return (
              <div key={log.id} style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{ 
                  padding: '6px', 
                  borderRadius: '6px', 
                  background: config.bg,
                  color: config.color
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontWeight: 500, 
                    color: '#f8fafc', 
                    margin: '0 0 6px 0', 
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {log.message.length > 150 ? log.message.substring(0, 150) + '...' : log.message}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      background: '#0f172a', 
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      marginRight: '8px'
                    }}>{log.source}</span>
                    {formatTime(log.time)}
                  </p>
                </div>
              </div>
            )
          })}
          
          {filteredLogs.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              暂无日志记录
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
        {label === '错误' ? <XCircle size={20} /> : label === '警告' ? <AlertTriangle size={20} /> : <Info size={20} />}
      </div>
    </div>
  )
}