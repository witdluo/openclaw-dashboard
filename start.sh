#!/bin/bash
# OpenClaw Dashboard 启动脚本

cd ~/.openclaw/workspace/openclaw-dashboard

# 检查 node_modules
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
fi

# 启动开发服务器
echo "🚀 启动 OpenClaw Dashboard..."
echo "📍 访问地址: http://localhost:3000"
npm run dev