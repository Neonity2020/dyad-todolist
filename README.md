# Dyad Todo List - 全栈待办事项应用

一个使用现代技术栈构建的全栈待办事项管理应用，支持用户认证、任务管理、子任务和状态筛选。

## ✨ 功能特性

- 🔐 **用户认证系统** - 注册、登录、登出
- 📝 **待办事项管理** - 创建、编辑、删除、状态更新
- ✅ **子任务支持** - 为每个待办事项添加子任务
- 🎯 **状态筛选** - 按 Todo/Doing/Done 状态筛选任务
- 🎨 **拖拽排序** - 直观的任务排序体验
- 🌙 **深色模式** - 支持明暗主题切换
- 📱 **响应式设计** - 适配各种设备尺寸
- 🔒 **数据安全** - Row Level Security (RLS) 保护用户数据

## 🚀 技术栈

### 前端
- **React 18** - 现代化的 React 框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用优先的 CSS 框架
- **shadcn/ui** - 精美的 UI 组件库
- **React Router** - 客户端路由
- **React Query** - 服务端状态管理

### 后端 & 数据库
- **Supabase** - 开源 Firebase 替代方案
- **PostgreSQL** - 强大的关系型数据库
- **Prisma** - 现代数据库 ORM
- **Row Level Security** - 数据库级别的安全策略

### 开发工具
- **Vite** - 快速的构建工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化

## 🛠️ 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/dyad-todolist.git
cd dyad-todolist
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境配置
复制环境变量示例文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，填入您的 Supabase 配置：
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
VITE_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
VITE_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### 4. 数据库设置
详细的数据库设置说明请参考 [SETUP.md](./SETUP.md)

### 5. 生成 Prisma 客户端
```bash
pnpm db:generate
```

### 6. 启动开发服务器
```bash
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用

## 📚 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm preview          # 预览生产构建

# 数据库
pnpm db:generate      # 生成 Prisma 客户端
pnpm db:push         # 推送数据库架构
pnpm db:migrate      # 运行数据库迁移
pnpm db:studio       # 打开 Prisma Studio
pnpm db:reset        # 重置数据库

# 代码质量
pnpm lint             # 运行 ESLint
```

## 🏗️ 项目结构

```
dyad-todolist/
├── src/
│   ├── components/          # UI 组件
│   │   ├── ui/             # shadcn/ui 组件
│   │   ├── TodoForm.tsx    # 待办事项表单
│   │   ├── TodoItem.tsx    # 待办事项项
│   │   └── ProtectedRoute.tsx # 受保护路由
│   ├── contexts/            # React Context
│   │   └── AuthContext.tsx # 认证上下文
│   ├── lib/                 # 工具库
│   │   ├── supabase.ts     # Supabase 客户端
│   │   └── utils.ts        # 通用工具函数
│   ├── pages/               # 页面组件
│   │   ├── Index.tsx       # 主页
│   │   ├── Login.tsx       # 登录页
│   │   └── Register.tsx    # 注册页
│   ├── services/            # 服务层
│   │   ├── todoService.ts  # 待办事项服务
│   │   └── userService.ts  # 用户服务
│   └── App.tsx             # 应用根组件
├── prisma/                  # 数据库配置
│   └── schema.prisma       # Prisma 架构
├── public/                  # 静态资源
└── package.json             # 项目配置
```

## 🔐 认证流程

1. **用户注册** - 通过邮箱和密码创建账户
2. **邮箱验证** - Supabase 自动发送验证邮件
3. **用户登录** - 验证凭据并创建会话
4. **数据保护** - RLS 策略确保用户只能访问自己的数据

## 🗄️ 数据库设计

### 核心表结构
- **users** - 用户信息
- **todos** - 待办事项
- **subtasks** - 子任务

### 关系
- 一个用户可以有多个待办事项 (1:N)
- 一个待办事项可以有多个子任务 (1:N)
- 级联删除确保数据一致性

## 🚀 部署

### Vercel 部署
1. 连接 GitHub 仓库
2. 设置环境变量
3. 自动部署

### 其他平台
项目使用标准的 Vite 构建，可以部署到任何支持静态网站的平台上。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Dyad](https://www.dyad.sh/) - 项目构建工具
- [Neonity](https://neomatrix.club/) - 项目创建者
- [Supabase](https://supabase.com/) - 后端服务
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
