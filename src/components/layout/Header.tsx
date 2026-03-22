import { Calendar, RefreshCw } from 'lucide-react'

export function Header() {
  return (
    <div style={{ height: '56px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button style={{ padding: '8px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '6px' }}><RefreshCw size={18} /></button>
      </div>
    </div>
  )
}