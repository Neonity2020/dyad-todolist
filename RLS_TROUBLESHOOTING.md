# RLS 策略故障排除指南

## 问题描述

遇到错误：`更新排序失败: new row violates row-level security policy for table "todos"`

## 问题原因

这个错误是由于 Row Level Security (RLS) 策略配置问题导致的：

1. **RLS 策略缺失**：`todos` 表可能没有正确的 RLS 策略
2. **策略配置错误**：现有策略可能不允许更新 `order` 字段
3. **用户权限不足**：当前用户可能没有足够的权限执行更新操作

## 解决步骤

### 步骤 1：检查 RLS 状态

在 Supabase SQL Editor 中运行：

```sql
-- 检查 RLS 是否启用
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'todos';

-- 检查现有策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'todos';
```

### 步骤 2：重新创建 RLS 策略

如果策略缺失或配置错误，运行以下脚本：

```sql
-- 删除现有策略
DROP POLICY IF EXISTS "Users can view own todos" ON todos;
DROP POLICY IF EXISTS "Users can insert own todos" ON todos;
DROP POLICY IF EXISTS "Users can update own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON todos;

-- 创建新的 RLS 策略
-- 查看策略
CREATE POLICY "Users can view own todos" ON todos
    FOR SELECT USING (auth.uid()::text = user_id);

-- 插入策略
CREATE POLICY "Users can insert own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 更新策略（包括 order 字段）
CREATE POLICY "Users can update own todos" ON todos
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 删除策略
CREATE POLICY "Users can delete own todos" ON todos
    FOR DELETE USING (auth.uid()::text = user_id);
```

### 步骤 3：验证策略创建

```sql
-- 验证策略是否创建成功
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'todos';
```

### 步骤 4：测试 RLS 功能

```sql
-- 测试基本查询（需要在有用户认证的情况下）
SELECT 
    id,
    text,
    "order",
    user_id,
    created_at
FROM todos 
LIMIT 5;
```

## 代码修复

我们已经修复了代码中的问题：

### 1. TodoService.updateTodosOrder 方法

- 添加了 `userId` 参数
- 验证所有待办事项都属于当前用户
- 使用 `UPDATE` 而不是 `UPSERT` 操作
- 在更新时包含 `user_id` 条件

### 2. useTodos Hook

- 在调用 `updateTodosOrder` 时传递 `user.id`
- 添加用户登录状态检查

## 常见问题及解决方案

### 问题 1：策略创建失败

**错误**：`ERROR: policy "Users can update own todos" already exists`

**解决**：先删除现有策略，再重新创建

### 问题 2：权限不足

**错误**：`ERROR: permission denied for table todos`

**解决**：确保使用正确的数据库连接和用户权限

### 问题 3：RLS 未启用

**现象**：查询返回所有数据，没有用户隔离

**解决**：启用 RLS 并创建策略

```sql
-- 启用 RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
```

## 测试步骤

1. **运行 RLS 检查脚本**
2. **重新创建策略**
3. **刷新应用页面**
4. **尝试拖拽排序**
5. **检查控制台是否有错误**

## 预期结果

修复成功后：

✅ **拖拽排序正常工作**
✅ **排序数据保存到数据库**
✅ **没有 RLS 策略错误**
✅ **用户数据正确隔离**

## 故障排除检查清单

- [ ] RLS 已启用
- [ ] 策略已正确创建
- [ ] 用户已登录
- [ ] 代码已更新
- [ ] 数据库字段已添加
- [ ] 应用已重新构建

## 联系支持

如果问题仍然存在：

1. 检查 Supabase 项目状态
2. 查看 SQL Editor 的错误日志
3. 确认数据库连接正常
4. 检查用户认证状态
5. 联系 Supabase 支持团队
