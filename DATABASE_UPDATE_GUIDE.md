# 数据库更新指南 - 添加排序字段

## 问题描述

当前遇到错误：`获取待办事项失败: column todos.order does not exist`

这是因为我们添加了排序功能，但数据库中的 `todos` 表还没有 `order` 字段。

## 解决步骤

### 步骤 1：登录 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录您的账户
3. 选择您的项目

### 步骤 2：打开 SQL Editor

1. 在左侧菜单中点击 **"SQL Editor"**
2. 点击 **"New query"** 创建新查询

### 步骤 3：运行 SQL 脚本

复制并粘贴以下 SQL 脚本：

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

### 步骤 4：执行脚本

1. 点击 **"Run"** 按钮执行脚本
2. 检查输出结果，确保没有错误
3. 验证 `order` 字段是否已添加

### 步骤 5：验证更新

运行以下查询来验证更新是否成功：

```sql
-- 检查表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'todos'
ORDER BY ordinal_position;

-- 检查数据
SELECT id, text, "order", created_at 
FROM todos 
ORDER BY "order" ASC, created_at DESC
LIMIT 10;
```

## 预期结果

执行成功后，您应该看到：

1. **表结构更新**：`todos` 表新增 `order` 字段
2. **数据排序**：现有记录按创建时间分配了排序值
3. **索引创建**：`idx_todos_order` 索引已创建

## 故障排除

### 常见错误及解决方案

1. **权限错误**：
   ```
   ERROR: permission denied for table todos
   ```
   - 确保您有足够的数据库权限
   - 检查 RLS 策略设置

2. **字段已存在**：
   ```
   ERROR: column "order" of relation "todos" already exists
   ```
   - 跳过第一步的 ALTER TABLE 语句
   - 直接运行 UPDATE 和 CREATE INDEX 语句

3. **语法错误**：
   - 确保使用正确的 PostgreSQL 语法
   - 检查引号使用（PostgreSQL 中字段名用双引号）

### 手动检查

如果 SQL 执行失败，可以手动检查：

```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables WHERE table_name = 'todos';

-- 检查字段是否存在
SELECT column_name FROM information_schema.columns WHERE table_name = 'todos';

-- 检查数据
SELECT * FROM todos LIMIT 5;
```

## 更新后的功能

数据库更新完成后，您将能够：

✅ **拖拽排序**：通过拖拽重新排列任务顺序
✅ **排序持久化**：排序顺序保存到数据库
✅ **性能优化**：排序查询使用索引优化
✅ **向后兼容**：现有功能不受影响

## 下一步

数据库更新完成后：

1. 刷新应用页面
2. 测试拖拽排序功能
3. 验证排序是否持久化保存
4. 测试状态筛选与排序的兼容性

## 联系支持

如果遇到问题：

1. 检查 Supabase 项目状态
2. 查看 SQL Editor 的错误日志
3. 确认数据库连接正常
4. 联系 Supabase 支持团队
