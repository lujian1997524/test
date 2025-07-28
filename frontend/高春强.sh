#!/bin/bash

echo "🔄 高春强一键恢复原版布局..."
echo "正在恢复layout组件..."

# 恢复layout组件
cp -r /Users/gao/Desktop/work/frontend/backup/原版布局备份/layout/* /Users/gao/Desktop/work/frontend/components/layout/

# 恢复主页面 
cp /Users/gao/Desktop/work/frontend/backup/原版布局备份/page-original.tsx /Users/gao/Desktop/work/frontend/app/page.tsx

echo "✅ 恢复完成！原版顶部导航栏布局已恢复。"
echo "💡 提示：重启开发服务器以查看变更"