import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Play, Clock, CheckCircle, XCircle, Pause } from 'lucide-react'
import { fetchCronJobs } from '../../api/system'

type FilterType = 'all' | 'enabled' | 'disabled' | 'failed'

export function CronPanel() {
  const { data: jobs } = useQuery({ queryKey: ['cron-jobs'], queryFn: fetchCronJobs })
  const [filter, setFilter] = useState<FilterType>('all')
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
  
  const stats = { 
    total: jobs?.length || 0, 
    enabled: jobs?.filter((j: any) => j.enabled).length || 0, 
    disabled: jobs?.filter((j: any) => !j.enabled).length || 0, 
    failed: jobs?.filter((j: any) => j.lastStatus === 'error').length || 0 
  }
  
  // 筛选任务
  const filteredJobs = jobs?.filter((job: any) => {
    switch (filter) {
      case 'enabled': return job.enabled
      case 'disabled': return !job.enabled
      case 'failed': return job.lastStatus === 'error'
      default: return true
    }
  })
  
  // 按下次运行时间排序（从早到晚）
  const sortedJobs = filteredJobs?.sort((a: any, b: any) => {
    if (!a.nextRun) return 1
    if (!b.nextRun) return -1
    return new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime()
  })
  
  const filterLabels: Record<FilterType, string> = {
    all: '全部',
    enabled: '已启用',
    disabled: '已禁用',
    failed: '最近失败'
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
          <StatCard label="任务总数" value={stats.total} icon={<Clock size={20} />} color="#8b5cf6" active={filter === 'all'} onClick={() => setFilter('all')} />
          <StatCard label="已启用" value={stats.enabled} icon={<CheckCircle size={20} />} color="#10b981" active={filter === 'enabled'} onClick={() => setFilter('enabled')} />
          <StatCard label="已禁用" value={stats.disabled} icon={<Pause size={20} />} color="#f59e0b" active={filter === 'disabled'} onClick={() => setFilter('disabled')} />
          <StatCard label="最近失败" value={stats.failed} icon={<XCircle size={20} />} color="#f43f5e" active={filter === 'failed'} onClick={() => setFilter('failed')} />
        </div>
      </div>
      
      {/* 占位符，防止内容被覆盖 */}
      <div style={{ height: '140px' }} />
      
      {filter !== 'all' && (
        <div style={{ marginBottom: '16px', padding: '10px 16px', background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>筛选：{filterLabels[filter]}</span>
          <button onClick={() => setFilter('all')} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>显示全部</button>
        </div>
      )}
      
      <div className="card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="card-header"><h3>定时任务列表</h3></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>任务名称</th>
                <th>调度</th>
                <th>下次运行</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs?.map((job: any) => <JobRow key={job.id} job={job} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, active, onClick }: { label: string; value: number; icon: React.ReactNode; color: string; active: boolean; onClick: () => void }) {
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

function JobRow({ job }: { job: any }) {
  const statusConfig: Record<string, { bg: string; text: string }> = { 
    ok: { bg: 'badge-success', text: '成功' }, 
    error: { bg: 'badge-error', text: '失败' }, 
    running: { bg: 'badge-info', text: '运行中' } 
  }
  const status = statusConfig[job.lastStatus || 'ok']
  
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-dot ${job.enabled ? 'status-online' : 'status-idle'}`} />
          <span style={{ color: '#f8fafc' }}>{job.name}</span>
        </div>
      </td>
      <td>
        <code style={{ fontSize: '12px', color: '#94a3b8', background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>{job.schedule}</code>
      </td>
      <td style={{ color: '#94a3b8' }}>
        {job.nextRun ? new Date(job.nextRun).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
      </td>
      <td>
        {job.lastStatus ? <span className={`badge ${status.bg}`}>{status.text}</span> : '-'}
      </td>
      <td>
        <button className="btn btn-ghost" style={{ padding: '6px' }}><Play size={16} /></button>
      </td>
    </tr>
  )
}