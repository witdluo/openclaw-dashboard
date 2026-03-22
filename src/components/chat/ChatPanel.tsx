import { useState, useEffect } from 'react'
import { Send, User, Sparkles } from 'lucide-react'
import { fetchAgents } from '../../api/system'

const STORAGE_KEY = 'openclaw-chat-history'

function loadChatHistory() {
  try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) return JSON.parse(saved) } catch (e) {}
  return {}
}

function saveChatHistory(history: Record<string, any>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)) } catch (e) {}
}

const agentColors: Record<string, string> = {
  'main': '#8b5cf6', 'cfo': '#10b981', 'errand': '#3b82f6', 'coordinator': '#f97316',
  'security': '#f43f5e', 'clerk': '#f59e0b', 'family': '#06b6d4'
}

export function ChatPanel() {
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [chatHistories, setChatHistories] = useState<Record<string, {role: string, content: string, time: string}[]>>(loadChatHistory)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    fetchAgents().then(data => { setAgents(data); if (data.length > 0 && !selectedAgent) setSelectedAgent(data[0]) })
  }, [])

  const chatHistory = selectedAgent ? (chatHistories[selectedAgent.id] || []) : []
  useEffect(() => { saveChatHistory(chatHistories) }, [chatHistories])
  const getAgentColor = (agentId: string) => agentColors[agentId] || '#64748b'

  const sendMessage = () => {
    if (!message.trim() || !selectedAgent) return
    setChatHistories(prev => ({ ...prev, [selectedAgent.id]: [...(prev[selectedAgent.id] || []), { role: 'user', content: message, time: new Date().toISOString() }] }))
    const msg = message; setMessage(''); setIsTyping(true)
    
    // 调用后端 API 发送消息
    fetch('http://localhost:3100/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: selectedAgent.id, message: msg })
    })
    .then(res => res.json())
    .then(data => {
      setChatHistories(prev => ({ 
        ...prev, 
        [selectedAgent.id]: [...(prev[selectedAgent.id] || []), { role: 'agent', content: data.response || '消息已发送', time: new Date().toISOString() }] 
      }))
      setIsTyping(false)
    })
    .catch(() => {
      setChatHistories(prev => ({ ...prev, [selectedAgent.id]: [...(prev[selectedAgent.id] || []), { role: 'agent', content: '消息已发送，请稍后查看回复。', time: new Date().toISOString() }] }))
      setIsTyping(false)
    })
  }

  if (!selectedAgent) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>加载中...</div>
  const agentColor = getAgentColor(selectedAgent.id)

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 140px)' }}>
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>选择 Agent</div>
        {agents.map((agent) => {
          const color = getAgentColor(agent.id)
          const count = (chatHistories[agent.id] || []).length
          return (
            <button key={agent.id} onClick={() => setSelectedAgent(agent)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: selectedAgent.id === agent.id ? '2px solid ' + color : '1px solid #334155', background: selectedAgent.id === agent.id ? color + '15' : '#1e293b', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{agent.emoji || agent.name.charAt(0)}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 500, color: '#f8fafc', fontSize: 13 }}>{agent.name}</div><div style={{ fontSize: 10, color: '#64748b' }}>{count > 0 ? Math.floor(count/2) + ' 条对话' : agent.id}</div></div>
            </button>
          )
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: agentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{selectedAgent.emoji || selectedAgent.name.charAt(0)}</div>
          <div><div style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedAgent.name}</div><div style={{ fontSize: 12, color: '#64748b' }}>{selectedAgent.model?.replace('bailian/', '')}</div></div>
          <span className="status-dot status-online" style={{ marginLeft: 'auto' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chatHistory.length === 0 && <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}><Sparkles size={32} style={{ marginBottom: 12, color: agentColor }} /><div style={{ fontSize: 14, marginBottom: 4 }}>选择一个 Agent 开始聊天</div></div>}
          {chatHistory.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {msg.role === 'agent' && <div style={{ width: 28, height: 28, borderRadius: 6, background: agentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{selectedAgent.emoji || selectedAgent.name.charAt(0)}</div>}
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0', background: msg.role === 'user' ? '#3b82f6' : '#0f172a', color: '#f8fafc', fontSize: 14, marginLeft: msg.role === 'user' ? 'auto' : 0 }}>{msg.content}</div>
              {msg.role === 'user' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><User size={14} /></div>}
            </div>
          ))}
          {isTyping && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div style={{ width: 28, height: 28, borderRadius: 6, background: agentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{selectedAgent.emoji}</div><div style={{ color: '#64748b', fontSize: 13 }}>正在输入...</div></div>}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #334155', display: 'flex', gap: 12 }}>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={'发送消息给 ' + selectedAgent.name + '...'} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none' }} />
          <button onClick={sendMessage} style={{ padding: '12px 20px', borderRadius: 8, border: 'none', background: agentColor, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500 }}><Send size={16} /> 发送</button>
        </div>
      </div>
    </div>
  )
}