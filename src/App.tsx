import { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { AgentPanel } from './components/agents/AgentPanel'
import { CronPanel } from './components/cron/CronPanel'
import { ResourcePanel } from './components/resources/ResourcePanel'
import { MessagePanel } from './components/messages/MessagePanel'
import { LogPanel } from './components/logs/LogPanel'

function App() {
  const [activeTab, setActiveTab] = useState('agents')

  const renderContent = () => {
    switch (activeTab) {
      case 'agents': return <AgentPanel onNavigate={setActiveTab} />
      case 'cron': return <CronPanel />
      case 'resources': return <ResourcePanel />
      case 'messages': return <MessagePanel />
      case 'logs': return <LogPanel />
      default: return <AgentPanel onNavigate={setActiveTab} />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '240px', zIndex: 100 }}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#1e293b' }}>
          <Header />
        </div>
        <main style={{ flex: 1, padding: '24px', overflow: 'auto', background: '#0f172a' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App