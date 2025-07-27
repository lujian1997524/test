#!/bin/bash

# 激光切割生产管理系统 - 快速调试脚本

echo "🔥 激光切割生产管理系统 - 调试模式"
echo "========================================"

# 检查后端连接
echo "🔌 检查后端连接..."
if curl -s http://192.168.31.203:35001/health > /dev/null; then
    echo "✅ 后端连接正常"
else
    echo "❌ 后端连接失败 - 请检查后端服务是否启动"
    echo "   后端地址: http://192.168.31.203:35001"
fi

echo ""
echo "🚀 启动调试模式..."
echo ""

# 设置环境变量
export NODE_ENV=production
export ELECTRON_ENABLE_LOGGING=1

# 启动应用
node_modules/.bin/electron . --enable-logging

echo ""
echo "🔍 如果应用出现问题，请查看上方的调试日志"
echo "📋 调试指南请查看: 调试指南.md"