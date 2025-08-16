-- 添加 order 字段到 todos 表
-- 在 Supabase SQL 编辑器中运行此脚本

-- 1. 添加 order 字段
ALTER TABLE todos ADD COLUMN "order" INTEGER DEFAULT 0;

-- 2. 为现有记录设置默认排序（按创建时间）
UPDATE todos 
SET "order" = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM todos
) AS subquery
WHERE todos.id = subquery.id;

-- 3. 创建索引以提高排序查询性能
CREATE INDEX idx_todos_order ON todos("order");

-- 4. 验证更改
SELECT id, text, "order", created_at 
FROM todos 
ORDER BY "order" ASC, created_at DESC;
