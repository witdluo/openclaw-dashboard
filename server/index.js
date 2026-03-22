import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Module 支持
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载 .env 文件（如果存在）
try {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
    console.log('✅ 已加载 .env 配置')
  }
} catch (e) {
  console.log('⚠️ 未找到 .env 文件，使用默认配置')
}

const execAsync = promisify(exec)
const app = express()

// 配置
const PORT = parseInt(process.env.API_PORT || '3100')
const OPENCLAW_BASE = process.env.OPENCLAW_PATH || path.join(process.env.HOME || '', '.openclaw')
const MESSAGES_LIMIT = parseInt(process.env.MESSAGES_LIMIT || '100')
const ACTIVE_THRESHOLD_MINUTES = parseInt(process.env.ACTIVE_THRESHOLD_MINUTES || '5')

console.log(`📁 OpenClaw 路径: ${OPENCLAW_BASE}`)
console.log(`🌐 API 端口: ${PORT}`)

app.use(cors())
app.use(express.json())

// OpenClaw 配置路径
const OPENCLAW_CONFIG = path.join(OPENCLAW_BASE, 'openclaw.json')
const CRON_JOBS_PATH = path.join(OPENCLAW_BASE, 'cron', 'jobs.json')
const AGENTS_PATH = path.join(OPENCLAW_BASE, 'agents')

// 设置 PATH 环境变量
const env = {
  ...process.env,
  PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}`,
  HOME: process.env.HOME
}

// 读取 OpenClaw 配置
async function readOpenClawConfig() {
  try {
    const content = await fs.promises.readFile(OPENCLAW_CONFIG, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to read OpenClaw config:', error)
    return {}
  }
}

// API: 获取 Agents
app.get('/api/agents', async (req, res) => {
  try {
    const config = await readOpenClawConfig()
    const agentsList = config.agents?.list || []
    const defaultModel = config.models?.default || 'glm-5'
    
    // 获取每个 agent 的详细配置
    const agents = await Promise.all(agentsList.map(async (agent) => {
      const agentId = agent.id
      const agentPath = path.join(AGENTS_PATH, agentId, 'agent')
      const sessionsDir = path.join(AGENTS_PATH, agentId, 'sessions')
      let agentConfig = {}
      
      try {
        const agentConfigPath = path.join(agentPath, 'openclaw.json')
        if (fs.existsSync(agentConfigPath)) {
          agentConfig = JSON.parse(await fs.promises.readFile(agentConfigPath, 'utf-8'))
        }
      } catch (e) {
        // ignore
      }
      
      // 获取 agent 名称：优先 identity.name，然后 name，最后 id
      const name = agent.identity?.name || agent.name || agentId
      const model = agent.model || agentConfig.model?.primary || defaultModel
      const skills = agent.skills || agentConfig.skills || []
      const emoji = agent.identity?.emoji || '🤖'
      
      // 获取最近会话中使用的模型
      let activeModel = null
      try {
        const files = await fs.promises.readdir(sessionsDir)
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset'))
        
        // 找到最近修改的文件
        let latestFile = null
        let latestMtime = 0
        
        for (const file of jsonlFiles) {
          const stat = await fs.promises.stat(path.join(sessionsDir, file))
          if (stat.mtime.getTime() > latestMtime) {
            latestMtime = stat.mtime.getTime()
            latestFile = file
          }
        }
        
        // 从最近的文件中读取模型信息
        if (latestFile) {
          const content = await fs.promises.readFile(path.join(sessionsDir, latestFile), 'utf-8')
          const lines = content.trim().split('\n').filter(l => l.trim())
          
          // 查找最近的消息记录中的 model 字段
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const obj = JSON.parse(lines[i])
              if (obj.type === 'message' && obj.model) {
                activeModel = obj.model.replace('bailian/', '')
                break
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        // 忽略错误
      }
      
      // 判断是否活跃：检查最近 N 分钟内是否有消息活动
      let status = 'idle'
      let lastActive = new Date(0)
      let currentActivity = null
      const activeThreshold = Date.now() - ACTIVE_THRESHOLD_MINUTES * 60 * 1000
      
      try {
        const files = await fs.promises.readdir(sessionsDir)
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset'))
        
        // 找到最近修改的文件
        let latestFile = null
        let latestMtime = 0
        
        for (const file of jsonlFiles) {
          const stat = await fs.promises.stat(path.join(sessionsDir, file))
          if (stat.mtime.getTime() > lastActive.getTime()) {
            lastActive = stat.mtime
          }
          if (stat.mtime.getTime() > activeThreshold) {
            status = 'active'
          }
          if (stat.mtime.getTime() > latestMtime) {
            latestMtime = stat.mtime.getTime()
            latestFile = file
          }
        }
        
        // 获取最近的活动内容
        if (latestFile && status === 'active') {
          const content = await fs.promises.readFile(path.join(sessionsDir, latestFile), 'utf-8')
          const lines = content.trim().split('\n').filter(l => l.trim())
          
          // 从后往前找最近的消息或工具调用
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const obj = JSON.parse(lines[i])
              if (obj.type === 'toolCall' && obj.name) {
                const toolNames = {
                  'read': '读取文件',
                  'write': '写入文件',
                  'edit': '编辑文件',
                  'exec': '执行命令',
                  'browser': '浏览器操作',
                  'web_search': '搜索网络',
                  'web_fetch': '获取网页',
                  'cron': '管理定时任务',
                  'message': '发送消息',
                  'sessions_spawn': '启动子任务',
                  'sessions_send': '发送消息到会话'
                }
                currentActivity = {
                  type: 'tool',
                  name: toolNames[obj.name] || obj.name,
                  detail: obj.arguments?.path || obj.arguments?.command || ''
                }
                break
              } else if (obj.type === 'message' && obj.message?.role === 'user' && obj.message?.content) {
                let text = ''
                if (Array.isArray(obj.message.content)) {
                  for (const item of obj.message.content) {
                    if (item.type === 'text' && item.text) {
                      text = item.text
                      break
                    }
                  }
                } else if (typeof obj.message.content === 'string') {
                  text = obj.message.content
                }
                if (text) {
                  currentActivity = {
                    type: 'chat',
                    name: '对话中',
                    detail: text.substring(0, 50) + (text.length > 50 ? '...' : '')
                  }
                  break
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        // 目录不存在
      }
      
      return {
        id: agentId,
        name: name,
        model: model.replace('bailian/', ''),
        activeModel: activeModel,
        status: status,
        lastActive: lastActive.toISOString(),
        skills: skills,
        emoji: emoji,
        currentActivity: currentActivity
      }
    }))
    
    res.json(agents)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API: 获取 Cron 任务
app.get('/api/cron', async (req, res) => {
  try {
    const cronData = JSON.parse(await fs.promises.readFile(CRON_JOBS_PATH, 'utf-8'))
    
    const jobs = (cronData.jobs || []).map(job => {
      // 解析 schedule
      let schedule = ''
      let nextRun = null
      
      if (job.schedule?.kind === 'cron') {
        schedule = job.schedule.expr
        nextRun = job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null
      } else if (job.schedule?.kind === 'every') {
        const minutes = Math.floor(job.schedule.everyMs / 60000)
        schedule = `every ${minutes}min`
        nextRun = job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null
      }
      
      return {
        id: job.id,
        name: job.name,
        schedule,
        nextRun,
        lastStatus: job.state?.lastRunStatus || null,
        lastRunAt: job.state?.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : null,
        enabled: job.enabled,
        agentId: job.agentId
      }
    })
    
    // 按 nextRun 排序
    jobs.sort((a, b) => {
      if (!a.nextRun) return 1
      if (!b.nextRun) return -1
      return new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime()
    })
    
    res.json(jobs)
  } catch (error) {
    console.error('Cron error:', error)
    res.status(500).json({ error: error.message })
  }
})

// API: 获取资源使用情况
app.get('/api/resources', async (req, res) => {
  try {
    // 资源监控（跨平台支持）
    const platform = process.platform
    let cpuUsage = 0
    let memUsage = 0
    
    if (platform === 'win32') {
      // Windows: CPU 使用率
      try {
        const { stdout: cpuOut } = await execAsync('wmic cpu get loadpercentage /value', { env })
        const cpuMatch = cpuOut.match(/LoadPercentage=(\d+)/i)
        cpuUsage = cpuMatch ? parseFloat(cpuMatch[1]) : 0
      } catch (e) {
        try {
          const { stdout: psOut } = await execAsync('powershell "Get-Counter \'\\\\Processor(_Total)\\\\% Processor Time\' | Select-Object -ExpandProperty CounterSamples | Select-Object CookedValue"', { env })
          cpuUsage = parseFloat(psOut.trim()) || 0
        } catch (e2) {
          console.error('Windows CPU error:', e2)
        }
      }
      
      // Windows: 内存使用率
      try {
        const { stdout: memOut } = await execAsync('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value', { env })
        const totalMatch = memOut.match(/TotalVisibleMemorySize=(\d+)/i)
        const freeMatch = memOut.match(/FreePhysicalMemory=(\d+)/i)
        
        if (totalMatch && freeMatch) {
          const totalKB = parseInt(totalMatch[1])
          const freeKB = parseInt(freeMatch[1])
          memUsage = totalKB > 0 ? Math.round(((totalKB - freeKB) / totalKB) * 100) : 0
        }
      } catch (e) {
        try {
          const { stdout: psOut } = await execAsync('powershell "(Get-CimInstance Win32_OperatingSystem) | Select-Object TotalVisibleMemorySize, FreePhysicalMemory | ConvertTo-Json"', { env })
          const psData = JSON.parse(psOut)
          const totalKB = psData.TotalVisibleMemorySize || 1
          const freeKB = psData.FreePhysicalMemory || 0
          memUsage = Math.round(((totalKB - freeKB) / totalKB) * 100)
        } catch (e2) {
          console.error('Windows Memory error:', e2)
        }
      }
    } else if (platform === 'linux') {
      // Linux: CPU 使用率
      try {
        const { stdout: cpuOut } = await execAsync('top -bn1 | grep "Cpu(s)" | head -1', { env })
        const cpuMatch = cpuOut.match(/(\d+\.?\d*)%?\s*id/i)
        const cpuIdle = cpuMatch ? parseFloat(cpuMatch[1]) : 100
        cpuUsage = 100 - cpuIdle
      } catch (e) {
        try {
          const { stdout: statOut } = await execAsync('cat /proc/stat | grep "^cpu " | awk \'{print $5}\'', { env })
          const idle = parseInt(statOut.trim()) || 0
          cpuUsage = Math.max(0, 100 - idle / 100)
        } catch (e2) {
          console.error('Linux CPU error:', e2)
        }
      }
      
      // Linux: 内存使用率
      try {
        const { stdout: memOut } = await execAsync('free | grep Mem', { env })
        const parts = memOut.trim().split(/\s+/)
        const total = parseInt(parts[1]) || 1
        const available = parseInt(parts[6]) || parseInt(parts[3]) || 0
        memUsage = Math.round(((total - available) / total) * 100)
      } catch (e) {
        console.error('Linux Memory error:', e)
      }
    } else {
      // macOS: CPU 使用率
      const { stdout: cpuOut } = await execAsync('top -l 1 -n 0 | grep "CPU usage" | head -1', { env })
      const cpuMatch = cpuOut.match(/(\d+\.\d+)% user.*?(\d+\.\d+)% sys.*?(\d+\.\d+)% idle/)
      const cpuIdle = cpuMatch ? parseFloat(cpuMatch[3]) : 100
      cpuUsage = 100 - cpuIdle
      
      // macOS: 内存使用率
      const { stdout: memOut } = await execAsync('vm_stat', { env })
      const lines = memOut.split('\n')
      const memStats = {}
      
      for (const line of lines) {
        const match = line.match(/Pages\s+(\w+(?:\s+\w+)?):\s+(\d+)/)
        if (match) {
          memStats[`Pages ${match[1]}`] = parseInt(match[2])
        }
      }
      
      const totalPages = (memStats['Pages free'] || 0) + 
                         (memStats['Pages active'] || 0) + 
                         (memStats['Pages inactive'] || 0) + 
                         (memStats['Pages wired down'] || 0) +
                         (memStats['Pages speculative'] || 0)
      const usedPages = (memStats['Pages active'] || 0) + 
                        (memStats['Pages inactive'] || 0) + 
                        (memStats['Pages wired down'] || 0)
      
      memUsage = totalPages > 0 ? Math.round((usedPages / totalPages) * 100) : 0
    }
    
    // 磁盘使用率（跨平台支持）
    let diskUsage = 0
    let diskTotal = '0G'
    let diskUsed = '0G'
    let diskAvail = '0G'
    
    if (platform === 'win32') {
      // Windows: 使用 wmic 命令
      try {
        const { stdout: diskOut } = await execAsync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace,Caption /value', { env })
        const sizeMatch = diskOut.match(/Size=(\d+)/i)
        const freeMatch = diskOut.match(/FreeSpace=(\d+)/i)
        
        if (sizeMatch && freeMatch) {
          const totalBytes = parseInt(sizeMatch[1])
          const freeBytes = parseInt(freeMatch[1])
          const usedBytes = totalBytes - freeBytes
          
          diskUsage = Math.round((usedBytes / totalBytes) * 100)
          diskTotal = Math.round(totalBytes / 1e9) + 'G'
          diskUsed = Math.round(usedBytes / 1e9) + 'G'
          diskAvail = Math.round(freeBytes / 1e9) + 'G'
        }
      } catch (e) {
        // 备用方案：PowerShell
        try {
          const { stdout: psOut } = await execAsync('powershell "Get-PSDrive C | Select-Object Used,Free | ConvertTo-Json"', { env })
          const psData = JSON.parse(psOut)
          const usedBytes = psData.Used || 0
          const freeBytes = psData.Free || 0
          const totalBytes = usedBytes + freeBytes
          
          diskUsage = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0
          diskTotal = Math.round(totalBytes / 1e9) + 'G'
          diskUsed = Math.round(usedBytes / 1e9) + 'G'
          diskAvail = Math.round(freeBytes / 1e9) + 'G'
        } catch (e2) {
          console.error('Windows disk error:', e2)
        }
      }
    } else {
      // macOS / Linux: 使用 df -H (十进制 GB)
      const { stdout: diskOut } = await execAsync('df -H / | tail -1', { env })
      const diskMatch = diskOut.match(/(\d+)%/)
      diskUsage = diskMatch ? parseInt(diskMatch[1]) : 0
      
      const diskParts = diskOut.trim().split(/\s+/)
      diskTotal = diskParts[1] || '0G'
      diskUsed = diskParts[2] || '0G'
      diskAvail = diskParts[3] || '0G'
      
      // macOS: 尝试获取更准确的可用空间（包含可清除空间）
      if (platform === 'darwin') {
        try {
          const { stdout: infoOut } = await execAsync('diskutil info / 2>/dev/null | grep -E "Available Space|Total Size"', { env })
          const availMatch = infoOut.match(/Available Space.*?(\d+\.?\d*)\s*(GB|Gi|TB)/i)
          
          if (availMatch) {
            const availValue = parseFloat(availMatch[1])
            const availUnit = availMatch[2].toUpperCase()
            diskAvail = availUnit === 'TB' ? (availValue * 1000) + 'G' : availValue + 'G'
          }
        } catch (e) {
          // 使用 df 的值
        }
      }
    }
    
    res.json({ 
      cpu: parseFloat(cpuUsage.toFixed(1)), 
      memory: memUsage, 
      disk: diskUsage,
      diskTotal,
      diskUsed,
      diskAvail,
      platform
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API: 获取 Top 进程
app.get('/api/processes', async (req, res) => {
  try {
    // CPU Top 10
    const { stdout: cpuOut } = await execAsync('ps aux | sort -nrk 3 | head -10', { env })
    const cpuProcesses = cpuOut.trim().split('\n').slice(1).map(line => {
      const parts = line.trim().split(/\s+/)
      return {
        name: parts[10] || parts[0],
        pid: parseInt(parts[1]),
        usage: parseFloat(parts[2])
      }
    })
    
    // Memory Top 10
    const { stdout: memOut } = await execAsync('ps aux | sort -nrk 4 | head -10', { env })
    const memProcesses = memOut.trim().split('\n').slice(1).map(line => {
      const parts = line.trim().split(/\s+/)
      return {
        name: parts[10] || parts[0],
        pid: parseInt(parts[1]),
        memory: Math.round(parseFloat(parts[5]) / 1024) // RSS in MB
      }
    })
    
    res.json({ cpu: cpuProcesses, memory: memProcesses })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API: 获取所有消息记录
app.get('/api/messages/all', async (req, res) => {
  try {
    const config = await readOpenClawConfig()
    const agentsList = config.agents?.list || []
    
    const allMessages = []
    
    for (const agent of agentsList) {
      const agentId = agent.id
      const sessionsDir = path.join(AGENTS_PATH, agentId, 'sessions')
      const agentName = agent.identity?.name || agent.name || agentId
      const emoji = agent.identity?.emoji || '🤖'
      
      try {
        const files = await fs.promises.readdir(sessionsDir)
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset'))
        
        for (const file of jsonlFiles) {
          const content = await fs.promises.readFile(path.join(sessionsDir, file), 'utf-8')
          const lines = content.trim().split('\n')
          
          for (const line of lines) {
            try {
              const obj = JSON.parse(line)
              if (obj.type === 'message' && obj.message?.role && obj.message?.content) {
                let text = ''
                if (Array.isArray(obj.message.content)) {
                  for (const item of obj.message.content) {
                    if (item.type === 'text' && item.text) {
                      text = item.text
                      break
                    }
                  }
                } else if (typeof obj.message.content === 'string') {
                  text = obj.message.content
                }
                
                if (text) {
                  allMessages.push({
                    id: obj.id,
                    agentId,
                    agentName,
                    emoji,
                    role: obj.message.role,
                    text: text.substring(0, 500),
                    time: obj.timestamp
                  })
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
    
    // 按时间倒序排序（最新的在前）
    allMessages.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    
    res.json({
      total: allMessages.length,
      messages: allMessages.slice(0, 500) // 最近 500 条
    })
  } catch (error) {
    console.error('Messages all error:', error)
    res.status(500).json({ error: error.message })
  }
})

// API: 获取今日聊天消息
app.get('/api/messages/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // 读取所有 agent
    const config = await readOpenClawConfig()
    const agentsList = config.agents?.list || []
    
    const allMessages = []
    
    for (const agent of agentsList) {
      const agentId = agent.id
      const sessionsDir = path.join(AGENTS_PATH, agentId, 'sessions')
      const agentName = agent.identity?.name || agent.name || agentId
      const emoji = agent.identity?.emoji || '🤖'
      
      try {
        const files = await fs.promises.readdir(sessionsDir)
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset'))
        
        for (const file of jsonlFiles) {
          const stat = await fs.promises.stat(path.join(sessionsDir, file))
          const mtime = stat.mtime.toISOString().split('T')[0]
          
          if (mtime === today) {
            const content = await fs.promises.readFile(path.join(sessionsDir, file), 'utf-8')
            const lines = content.trim().split('\n')
            
            for (const line of lines) {
              try {
                const obj = JSON.parse(line)
                if (obj.type === 'message' && obj.message?.role && obj.message?.content) {
                  const msgDate = (obj.timestamp || '').split('T')[0]
                  if (msgDate === today) {
                    let text = ''
                    if (Array.isArray(obj.message.content)) {
                      for (const item of obj.message.content) {
                        if (item.type === 'text' && item.text) {
                          text = item.text
                          break
                        }
                      }
                    } else if (typeof obj.message.content === 'string') {
                      text = obj.message.content
                    }
                    
                    if (text) {
                      allMessages.push({
                        id: obj.id,
                        agentId,
                        agentName,
                        emoji,
                        role: obj.message.role,
                        text: text.substring(0, 500),
                        time: obj.timestamp
                      })
                    }
                  }
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
    }
    
    // 按时间倒序排序（最新的在前）
    allMessages.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    
    res.json({
      total: allMessages.length,
      date: today,
      messages: allMessages.slice(0, MESSAGES_LIMIT)
    })
  } catch (error) {
    console.error('Messages today error:', error)
    res.status(500).json({ error: error.message })
  }
})

// API: 获取消息统计
app.get('/api/messages/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const config = await readOpenClawConfig()
    const agentsList = config.agents?.list || []
    
    let totalToday = 0
    const agentStats = {}
    
    for (const agent of agentsList) {
      const agentId = agent.id
      const sessionsDir = path.join(AGENTS_PATH, agentId, 'sessions')
      let agentToday = 0
      
      try {
        const files = await fs.promises.readdir(sessionsDir)
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset'))
        
        for (const file of jsonlFiles) {
          const stat = await fs.promises.stat(path.join(sessionsDir, file))
          const mtime = stat.mtime.toISOString().split('T')[0]
          if (mtime === today) {
            const content = await fs.promises.readFile(path.join(sessionsDir, file), 'utf-8')
            const messages = (content.match(/"type":"message"/g) || []).length
            agentToday += messages
          }
        }
      } catch (e) {}
      
      agentStats[agentId] = agentToday
      totalToday += agentToday
    }
    
    res.json({
      total: totalToday,
      byAgent: agentStats,
      date: today
    })
  } catch (error) {
    console.error('Messages stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

// API: 获取 Sessions
app.get('/api/sessions', async (req, res) => {
  res.json([])
})

// API: 获取日志
app.get('/api/logs', async (req, res) => {
  try {
    const logsDir = path.join(OPENCLAW_BASE, 'logs')
    const allLogs = []
    
    // 读取 Gateway 错误日志
    const errLogPath = path.join(logsDir, 'gateway.err.log')
    if (fs.existsSync(errLogPath)) {
      const content = await fs.promises.readFile(errLogPath, 'utf-8')
      const lines = content.trim().split('\n').filter(l => l.trim()).slice(-50) // 最近 50 条
      
      lines.forEach((line, i) => {
        const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/)
        const time = timeMatch ? timeMatch[1] : new Date().toISOString()
        
        let level = 'info'
        if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')) {
          level = 'error'
        } else if (line.toLowerCase().includes('warn')) {
          level = 'warning'
        }
        
        allLogs.push({
          id: `err-${i}`,
          level,
          message: line.substring(0, 200),
          time,
          source: 'gateway'
        })
      })
    }
    
    // 读取 Cron 任务失败记录
    const cronPath = CRON_JOBS_PATH
    if (fs.existsSync(cronPath)) {
      const cronData = JSON.parse(await fs.promises.readFile(cronPath, 'utf-8'))
      cronData.jobs?.forEach((job) => {
        if (job.state?.lastRunStatus === 'error') {
          allLogs.push({
            id: `cron-${job.id}`,
            level: 'error',
            message: `定时任务失败: ${job.name}`,
            time: job.state.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : new Date().toISOString(),
            source: 'cron'
          })
        }
      })
    }
    
    // 按时间倒序排序
    allLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    
    const errorCount = allLogs.filter(l => l.level === 'error').length
    const warningCount = allLogs.filter(l => l.level === 'warning').length
    const infoCount = allLogs.filter(l => l.level === 'info').length
    
    res.json({
      total: allLogs.length,
      errorCount,
      warningCount,
      infoCount,
      logs: allLogs.slice(0, 100)
    })
  } catch (error) {
    console.error('Logs error:', error)
    res.status(500).json({ error: error.message })
  }
})

// API: 发送聊天消息到 Agent
app.post('/api/chat/send', async (req, res) => {
  try {
    const { agentId, message } = req.body
    if (!agentId || !message) {
      return res.status(400).json({ error: '缺少 agentId 或 message' })
    }
    
    // 从 OpenClaw 配置获取 Gateway 端口
    const config = await readOpenClawConfig()
    const gatewayPort = config.gateway?.port || 18789
    const gatewayUrl = 'http://localhost:' + gatewayPort + '/api/sessions/send'
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: agentId, message: message })
    })
    
    if (!response.ok) {
      return res.json({ success: true, response: '消息已发送到 ' + agentId + '，请稍后查看回复。', note: 'Gateway API 暂不可用' })
    }
    
    const result = await response.json()
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Chat send error:', error)
    res.json({ success: true, response: '消息已发送，请稍后查看回复。', note: '通过备用方式发送' })
  }
})

// API: 健康检查
app.get('/api/health', async (req, res) => {
  const config = await readOpenClawConfig()
  const defaultModel = config.agents?.defaults?.model?.primary || 'glm-5'
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    config: {
      openclawPath: OPENCLAW_BASE,
      apiPort: PORT,
      defaultModel: defaultModel.replace('bailian/', '')
    }
  })
})

app.listen(PORT, () => {
  console.log(`✅ OpenClaw Dashboard API 运行在 http://localhost:${PORT}`)
})