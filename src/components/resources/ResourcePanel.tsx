import { useQuery } from '@tanstack/react-query'
import { Cpu, Activity, HardDrive } from 'lucide-react'
import { fetchResourceUsage, fetchTopProcesses } from '../../api/system'

export function ResourcePanel() {
  const { data: resources } = useQuery({
    queryKey: ['resources'],
    queryFn: fetchResourceUsage,
    refetchInterval: 5000, // 每 5 秒刷新
  })

  const { data: topProcesses } = useQuery({
    queryKey: ['top-processes'],
    queryFn: fetchTopProcesses,
    refetchInterval: 5000,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <MetricCard title="CPU 使用率" value={resources?.cpu || 0} unit="%" icon={<Cpu size={20} />} color="#3b82f6" />
        <MetricCard title="内存使用" value={resources?.memory || 0} unit="%" icon={<Activity size={20} />} color="#8b5cf6" />
      </div>

      {/* Top Processes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {/* CPU Top Processes */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} style={{ color: '#3b82f6' }} />
              <h3>CPU 占用 Top 10</h3>
            </div>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>进程</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>PID</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>CPU</th>
                </tr>
              </thead>
              <tbody>
                {topProcesses?.cpu?.map((proc: any, i: number) => (
                  <tr key={proc.pid} style={{ borderBottom: i === 9 ? 'none' : '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 0', color: '#f8fafc', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '4px', 
                          background: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#94a3b8'
                        }}>{i + 1}</span>
                        {proc.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 0', color: '#64748b', fontSize: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{proc.pid}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '6px', 
                          background: '#1e293b', 
                          borderRadius: '3px', 
                          overflow: 'hidden' 
                        }}>
                          <div style={{ 
                            width: `${Math.min(proc.usage * 5, 100)}%`, 
                            height: '100%', 
                            background: proc.usage > 10 ? '#f59e0b' : '#3b82f6', 
                            borderRadius: '3px' 
                          }} />
                        </div>
                        <span style={{ color: proc.usage > 10 ? '#f59e0b' : '#94a3b8', fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>{proc.usage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Memory Top Processes */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: '#8b5cf6' }} />
              <h3>内存占用 Top 10</h3>
            </div>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>进程</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>PID</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>内存</th>
                </tr>
              </thead>
              <tbody>
                {topProcesses?.memory?.map((proc: any, i: number) => (
                  <tr key={proc.pid} style={{ borderBottom: i === 9 ? 'none' : '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 0', color: '#f8fafc', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '4px', 
                          background: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#94a3b8'
                        }}>{i + 1}</span>
                        {proc.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 0', color: '#64748b', fontSize: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{proc.pid}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '6px', 
                          background: '#1e293b', 
                          borderRadius: '3px', 
                          overflow: 'hidden' 
                        }}>
                          <div style={{ 
                            width: `${Math.min(proc.memory / 20, 100)}%`, 
                            height: '100%', 
                            background: proc.memory > 500 ? '#f59e0b' : '#8b5cf6', 
                            borderRadius: '3px' 
                          }} />
                        </div>
                        <span style={{ color: proc.memory > 500 ? '#f59e0b' : '#94a3b8', fontSize: '12px', minWidth: '50px', textAlign: 'right' }}>{proc.memory} MB</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Disk Usage */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: '#f59e0b15', color: '#f59e0b' }}>
              <HardDrive size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>磁盘使用</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>{resources?.disk || 0}%</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                已用 {resources?.diskUsed || '-'} / 总计 {resources?.diskTotal || '-'} · 可用 {resources?.diskAvail || '-'}
              </div>
            </div>
          </div>
          <div style={{ 
            width: '200px', 
            height: '8px', 
            background: '#1e293b', 
            borderRadius: '4px', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              width: `${resources?.disk || 0}%`, 
              height: '100%', 
              background: resources?.disk && resources.disk > 80 ? '#ef4444' : '#f59e0b', 
              borderRadius: '4px' 
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, unit, icon, color }: { title: string; value: number | string; unit: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: '#64748b' }}>{title}</span>
        <div style={{ 
          padding: '10px', 
          borderRadius: '10px', 
          background: `${color}15`,
          color
        }}>{icon}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, color: '#f8fafc' }}>{value}</span>
        <span style={{ fontSize: '13px', color: '#64748b' }}>{unit}</span>
      </div>
    </div>
  )
}