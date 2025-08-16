# Supabase 设置指南

## 🚀 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 "Start your project" 或 "New Project"
3. 选择组织或创建新组织
4. 填写项目信息：
   - **Name**: `dyad-todolist` (或您喜欢的名称)
   - **Database Password**: 设置一个强密码（请记住这个密码）
   - **Region**: 选择离您最近的地区
5. 点击 "Create new project"
6. 等待项目创建完成（通常需要 1-2 分钟）

### 2. 获取项目配置信息

项目创建完成后，进入 Dashboard：

1. **Project URL**: 在项目概览页面可以看到，格式如：
   ```
   https://abcdefghijklmnop.supabase.co
   ```

2. **API Keys**: 在左侧菜单点击 "Settings" → "API"
   - **anon public**: 这是 `VITE_SUPABASE_ANON_KEY`
   - **service_role**: 这是 `SUPABASE_SERVICE_ROLE_KEY`

3. **Database Password**: 您创建项目时设置的密码

### 3. 设置环境变量

1. 复制环境变量示例文件：
   ```bash
   cp env.example .env
   ```

2. 编辑 `.env` 文件，填入您的配置：
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
   VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
   VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
   SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
   ```

   示例：
   ```env
   DATABASE_URL="postgresql://postgres:mypassword123@db.abcdefghijklmnop.supabase.co:5432/postgres"
   VITE_SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

### 4. 创建数据库表

1. 在 Supabase Dashboard 中，点击左侧菜单的 "SQL Editor"
2. 创建新的查询，粘贴以下 SQL 代码：

```sql
-- 创建用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建待办事项表
CREATE TABLE todos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'DOING', 'DONE')),
  url TEXT,
  github_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- 创建子任务表
CREATE TABLE subtasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_subtasks_todo_id ON subtasks(todo_id);
CREATE INDEX idx_users_email ON users(email);
```

3. 点击 "Run" 执行 SQL

### 5. 启用 Row Level Security (RLS)

在 SQL Editor 中执行以下代码：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- 待办事项表策略
CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (auth.uid()::text = user_id);

-- 子任务表策略
CREATE POLICY "Users can view own subtasks" ON subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM todos 
      WHERE todos.id = subtasks.todo_id 
      AND todos.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own subtasks" ON subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos 
      WHERE todos.id = subtasks.todo_id 
      AND todos.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own subtasks" ON subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM todos 
      WHERE todos.id = subtasks.todo_id 
      AND todos.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own subtasks" ON subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM todos 
      WHERE todos.id = subtasks.todo_id 
      AND todos.user_id = auth.uid()::text
    )
  );
```

### 6. 配置认证设置

1. 在左侧菜单点击 "Authentication" → "Settings"
2. 在 "Site URL" 中添加您的开发环境 URL：
   - 开发环境：`http://localhost:5173`
   - 生产环境：您的实际域名
3. 在 "Redirect URLs" 中添加：
   - `http://localhost:5173/login`
   - `http://localhost:5173/register`

### 7. 测试应用

1. 启动开发服务器：
   ```bash
   pnpm dev
   ```

2. 访问 `http://localhost:5173`
3. 尝试注册新用户
4. 登录并创建待办事项

## 🔧 故障排除

### 常见问题

1. **"Missing Supabase environment variables" 错误**
   - 检查 `.env` 文件是否正确创建
   - 确认环境变量名称正确（以 `VITE_` 开头）

2. **"Invalid JWT" 错误**
   - 检查 `VITE_SUPABASE_ANON_KEY` 是否正确
   - 确认项目 URL 正确

3. **"Permission denied" 错误**
   - 检查 RLS 策略是否正确设置
   - 确认用户已登录

4. **数据库连接失败**
   - 检查 `DATABASE_URL` 格式
   - 确认数据库密码正确

### 验证设置

1. **检查表是否创建成功**：
   - 在 Supabase Dashboard 中点击 "Table Editor"
   - 应该能看到 `users`、`todos`、`subtasks` 三个表

2. **检查 RLS 是否启用**：
   - 在 "Table Editor" 中，表名旁边应该有 "RLS" 标记

3. **检查策略是否创建**：
   - 在 "Authentication" → "Policies" 中查看策略列表

## 📚 下一步

设置完成后，您可以：

1. **自定义认证流程**：修改登录/注册页面的样式
2. **添加更多功能**：如任务标签、截止日期等
3. **部署到生产环境**：使用 Vercel、Netlify 等平台
4. **添加监控**：集成 Supabase Analytics 或第三方监控工具

## 🆘 获取帮助

- [Supabase 文档](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/yourusername/dyad-todolist/issues)
