# 任务排序功能设置指南

## 概述

我们已经为 Todo List 应用添加了拖拽排序功能，允许用户通过拖拽来重新排列任务的顺序。

## 需要完成的步骤

### 1. 更新数据库结构

在 Supabase Dashboard 中运行以下 SQL 脚本：

```sql
-- 添加 order 字段到 todos 表
ALTER TABLE todos ADD COLUMN "order" INTEGER DEFAULT 0;

-- 为现有记录设置默认排序（按创建时间）
UPDATE todos 
SET "order" = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM todos
) AS subquery
WHERE todos.id = subquery.id;

-- 创建索引以提高排序查询性能
CREATE INDEX idx_todos_order ON todos("order");

-- 验证更改
SELECT id, text, "order", created_at 
FROM todos 
ORDER BY "order" ASC, created_at DESC;
```

### 2. 功能特性

✅ **拖拽排序**：用户可以通过拖拽任务项来重新排列顺序
✅ **状态筛选**：支持按状态筛选任务（All, Todo, Doing, Done）
✅ **排序持久化**：排序顺序会保存到数据库
✅ **实时更新**：排序后立即更新界面和数据库

### 3. 使用方法

1. **拖拽排序**：
   - 点击并拖拽任务项左侧的拖拽手柄（⋮⋮）
   - 拖拽到目标位置释放
   - 排序会自动保存到数据库

2. **状态筛选**：
   - 点击状态按钮（All, Todo, Doing, Done）
   - 只显示对应状态的任务
   - 排序功能在筛选状态下仍然有效

### 4. 技术实现

- **前端**：使用 `@dnd-kit` 库实现拖拽功能
- **后端**：在 `todos` 表中添加 `order` 字段
- **同步**：拖拽结束后自动更新数据库中的排序
- **性能**：添加数据库索引优化排序查询

### 5. 文件修改

以下文件已更新以支持排序功能：

- `prisma/schema.prisma` - 添加 order 字段
- `src/lib/supabase.ts` - 更新类型定义
- `src/services/todoService.ts` - 添加排序相关方法
- `src/hooks/useTodos.ts` - 添加排序状态管理
- `src/pages/Index.tsx` - 实现拖拽处理逻辑
- `src/components/TodoItem.tsx` - 支持拖拽交互

### 6. 测试步骤

1. 确保数据库已更新（运行上述 SQL 脚本）
2. 启动应用：`pnpm dev`
3. 创建几个测试任务
4. 尝试拖拽重新排列任务
5. 刷新页面验证排序是否保持
6. 测试状态筛选功能

### 7. 故障排除

如果遇到问题：

1. **排序不生效**：检查数据库是否已添加 `order` 字段
2. **拖拽无响应**：检查浏览器控制台是否有错误
3. **排序丢失**：检查网络请求是否成功

## 注意事项

- 新创建的任务会自动添加到列表末尾
- 排序功能与状态筛选完全兼容
- 所有排序操作都会实时同步到数据库
- 支持跨状态拖拽排序

## 下一步

排序功能设置完成后，您可以：
- 测试拖拽排序功能
- 验证数据持久化
- 根据需要调整排序逻辑
- 添加更多排序选项（如按优先级、截止日期等）
