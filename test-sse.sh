#!/bin/bash

# SSE功能测试脚本

echo "🧪 开始SSE功能测试..."

# 获取高春强的token（管理员）
echo "1. 获取管理员token..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:35001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name": "高春强"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "   管理员token: ${ADMIN_TOKEN:0:50}..."

# 获取杨伟的token（操作员）
echo "2. 获取操作员token..."
OPERATOR_RESPONSE=$(curl -s -X POST http://localhost:35001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name": "杨伟"}')

OPERATOR_TOKEN=$(echo $OPERATOR_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "   操作员token: ${OPERATOR_TOKEN:0:50}..."

# 测试创建项目（应该触发SSE事件）
echo "3. 创建测试项目..."
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:35001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "SSE测试项目-001", "description": "用于测试SSE功能的项目", "priority": "high"}')

PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "   创建的项目ID: $PROJECT_ID"

# 等待一秒
sleep 1

# 测试更新项目状态（应该触发SSE事件）
echo "4. 更新项目状态为进行中..."
curl -s -X PUT http://localhost:35001/api/projects/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPERATOR_TOKEN" \
  -d '{"status": "in_progress"}' > /dev/null

echo "   项目状态已更新为进行中"

# 等待一秒
sleep 1

# 测试再次更新项目状态
echo "5. 更新项目状态为已完成..."
curl -s -X PUT http://localhost:35001/api/projects/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "completed"}' > /dev/null

echo "   项目状态已更新为已完成"

# 检查SSE连接状态
echo "6. 检查SSE连接状态..."
SSE_STATUS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:35001/api/sse/status)

echo "   SSE状态: $SSE_STATUS"

# 发送测试消息
echo "7. 发送测试SSE消息..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:35001/api/sse/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"message": "这是一条测试SSE消息，用于验证推送功能", "eventType": "test"}')

echo "   测试消息响应: $TEST_RESPONSE"

# 清理：删除测试项目
echo "8. 清理测试项目..."
curl -s -X DELETE http://localhost:35001/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

echo "   测试项目已删除"

echo ""
echo "🎉 SSE功能测试完成！"
echo ""
echo "📝 测试说明："
echo "   - 如果有用户在浏览器中登录，他们应该会收到项目变更的通知"
echo "   - 打开浏览器控制台可以看到SSE事件日志"
echo "   - 右下角应该显示通知弹窗（仅其他用户的操作）"
echo ""
echo "🔗 测试步骤："
echo "   1. 在浏览器中访问 http://localhost:4000"
echo "   2. 分别用'高春强'和'杨伟'在不同浏览器/标签页中登录"
echo "   3. 在一个页面中进行项目操作，观察另一个页面的通知"