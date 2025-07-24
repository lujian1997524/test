#!/bin/bash

# 跨设备SSE连接测试脚本

echo "🧪 跨设备SSE连接测试..."

# 获取本机IP
LOCAL_IP=$(ifconfig | grep -E "inet.*broadcast" | head -1 | awk '{print $2}')
echo "📡 本机IP地址: $LOCAL_IP"

echo ""
echo "🔧 测试环境配置："
echo "   - 电脑A (服务器): $LOCAL_IP"
echo "   - 后端服务: http://$LOCAL_IP:35001"
echo "   - 前端服务: http://$LOCAL_IP:4000"
echo ""

# 测试后端服务是否可以从局域网访问
echo "1. 测试后端服务可访问性..."
if curl -s "http://$LOCAL_IP:35001/health" > /dev/null; then
    echo "   ✅ 后端服务可从局域网访问"
else
    echo "   ❌ 后端服务无法从局域网访问"
    echo "   请确保后端服务绑定到 0.0.0.0:35001"
    exit 1
fi

# 测试前端服务是否可以从局域网访问
echo "2. 测试前端服务可访问性..."
if curl -s "http://$LOCAL_IP:4000" > /dev/null; then
    echo "   ✅ 前端服务可从局域网访问"
else
    echo "   ❌ 前端服务无法从局域网访问"
    echo "   请确保前端服务使用 --host 0.0.0.0 启动"
fi

# 获取测试用的token
echo "3. 获取测试token..."
ADMIN_RESPONSE=$(curl -s -X POST "http://$LOCAL_IP:35001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"name": "高春强"}')

if echo "$ADMIN_RESPONSE" | grep -q "token"; then
    ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ 管理员token获取成功"
else
    echo "   ❌ 无法获取管理员token"
    echo "   响应: $ADMIN_RESPONSE"
    exit 1
fi

OPERATOR_RESPONSE=$(curl -s -X POST "http://$LOCAL_IP:35001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"name": "杨伟"}')

if echo "$OPERATOR_RESPONSE" | grep -q "token"; then
    OPERATOR_TOKEN=$(echo $OPERATOR_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ 操作员token获取成功"
else
    echo "   ❌ 无法获取操作员token"
fi

# 测试SSE连接 (后台运行)
echo "4. 测试SSE连接..."

# 创建一个临时测试SSE的脚本
cat > /tmp/test_sse.sh << EOF
#!/bin/bash
timeout 10s curl -s "http://$LOCAL_IP:35001/api/sse/connect?token=$ADMIN_TOKEN" | head -5
EOF

chmod +x /tmp/test_sse.sh

echo "   开始SSE连接测试 (10秒超时)..."
SSE_OUTPUT=$(/tmp/test_sse.sh)

if echo "$SSE_OUTPUT" | grep -q "event: connected"; then
    echo "   ✅ SSE连接测试成功"
    echo "   首次连接消息: $(echo "$SSE_OUTPUT" | head -2 | tail -1)"
else
    echo "   ❌ SSE连接测试失败"
    echo "   输出: $SSE_OUTPUT"
fi

# 检查当前SSE连接状态
echo "5. 检查SSE连接状态..."
SSE_STATUS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://$LOCAL_IP:35001/api/sse/status")

echo "   连接状态: $SSE_STATUS"

# 测试项目创建和SSE广播
echo "6. 测试项目操作和SSE广播..."

# 创建测试项目
PROJECT_RESPONSE=$(curl -s -X POST "http://$LOCAL_IP:35001/api/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "跨设备SSE测试项目", "description": "测试跨设备实时同步", "priority": "high"}')

if echo "$PROJECT_RESPONSE" | grep -q '"id"'; then
    PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "   ✅ 测试项目创建成功 (ID: $PROJECT_ID)"
    
    # 更新项目状态
    sleep 1
    curl -s -X PUT "http://$LOCAL_IP:35001/api/projects/$PROJECT_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPERATOR_TOKEN" \
      -d '{"status": "in_progress"}' > /dev/null
    
    echo "   ✅ 项目状态更新为进行中"
    
    # 清理测试项目
    sleep 1
    curl -s -X DELETE "http://$LOCAL_IP:35001/api/projects/$PROJECT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
    
    echo "   ✅ 测试项目已清理"
else
    echo "   ❌ 测试项目创建失败"
    echo "   响应: $PROJECT_RESPONSE"
fi

# 清理
rm -f /tmp/test_sse.sh

echo ""
echo "🎯 测试完成！"
echo ""
echo "📋 电脑B测试步骤："
echo "   1. 在电脑B上访问: http://$LOCAL_IP:4000"
echo "   2. 使用'杨伟'账号登录"
echo "   3. 打开浏览器控制台，观察SSE连接日志"
echo "   4. 在电脑A上进行项目操作"
echo "   5. 观察电脑B是否收到实时通知"
echo ""
echo "🔍 调试信息："
echo "   - 后端日志: 观察SSE连接和事件广播"
echo "   - 浏览器控制台: 观察SSE连接状态和事件接收"
echo "   - 网络面板: 检查EventSource连接是否成功建立"