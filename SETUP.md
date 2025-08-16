# Dyad Todo List 全栈设置指南

## 项目概述
这是一个使用 React + TypeScript + Prisma + Supabase 构建的全栈待办事项应用。

## 环境变量设置

### 1. 创建 .env 文件
在项目根目录创建 `.env` 文件，包含以下内容：

```env
# Supabase Database URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
VITE_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
VITE_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### 2. 获取 Supabase 配置信息

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 在项目设置中找到以下信息：
   - Project URL (用于 `VITE_SUPABASE_URL`)
   - anon/public key (用于 `VITE_SUPABASE_ANON_KEY`)
   - service_role key (用于 `SUPABASE_SERVICE_ROLE_KEY`)
   - Database password (用于 `DATABASE_URL`)

### 3. 数据库设置

1. 在 Supabase 项目中，进入 SQL Editor
2. 运行以下 SQL 创建表结构：

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
```

### 4. 启用 Row Level Security (RLS)

在 Supabase 中为每个表启用 RLS 并创建策略：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (auth.uid()::text = user_id);

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

## 运行项目

1. 安装依赖：
```bash
pnpm install
```

2. 设置环境变量（见上文）

3. 生成 Prisma 客户端：
```bash
npx prisma generate
```

4. 运行开发服务器：
```bash
pnpm dev
```

## 功能特性

- ✅ 用户注册和登录
- ✅ 待办事项管理（创建、编辑、删除）
- ✅ 子任务管理
- ✅ 状态筛选（Todo/Doing/Done）
- ✅ 拖拽排序
- ✅ 响应式设计
- ✅ 深色模式支持

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **UI 组件**: shadcn/ui
- **状态管理**: React Context + Hooks
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **认证**: Supabase Auth
- **构建工具**: Vite
