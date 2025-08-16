-- 检查并修复 RLS 策略
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 检查当前 RLS 策略
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

-- 2. 检查 RLS 是否启用
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'todos';

-- 3. 如果需要，重新创建 RLS 策略
-- 删除现有策略（如果存在）
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

-- 4. 验证策略是否创建成功
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

-- 5. 测试 RLS 是否工作
-- 注意：这需要在有用户认证的情况下测试
SELECT 
    id,
    text,
    "order",
    user_id,
    created_at
FROM todos 
LIMIT 5;
