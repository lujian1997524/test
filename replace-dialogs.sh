#!/bin/bash

# 批量替换浏览器弹窗的脚本

echo "开始批量替换浏览器弹窗..."

# 定义需要替换的文件
files=(
  "/Users/gao/Desktop/work/frontend/app/page.tsx"
  "/Users/gao/Desktop/work/frontend/components/projects/ProjectDetail.tsx"
  "/Users/gao/Desktop/work/frontend/components/drawings/DrawingLibrary.tsx"
  "/Users/gao/Desktop/work/frontend/components/materials/MaterialsTable.tsx"
  "/Users/gao/Desktop/work/frontend/components/materials/ProjectTree.tsx"
  "/Users/gao/Desktop/work/frontend/components/materials/ThicknessSpecModal.tsx"
  "/Users/gao/Desktop/work/frontend/components/ui/DrawingHoverCard.tsx"
  "/Users/gao/Desktop/work/frontend/app/simple-test/page.tsx"
)

# 备份原文件
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$file.backup"
    echo "已备份: $file"
  fi
done

echo "备份完成，开始替换..."

# 1. 添加 useDialog 导入
echo "添加 useDialog 导入..."
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # 查找是否已有 useDialog 导入
    if ! grep -q "useDialog" "$file"; then
      # 查找 @/components/ui 导入行并添加 useDialog
      sed -i.tmp "s/from '@\/components\/ui'/&/g; s/} from '@\/components\/ui'/&/g; s/import { \(.*\) } from '@\/components\/ui'/import { \1, useDialog } from '@\/components\/ui'/g" "$file"
      rm "$file.tmp"
      echo "已为 $file 添加 useDialog 导入"
    fi
  fi
done

echo "替换完成！"
echo "请手动检查和测试各个文件的功能。"