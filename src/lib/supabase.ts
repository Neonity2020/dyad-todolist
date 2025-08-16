import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 认证类型
export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

// 待办事项类型
export type Todo = {
  id: string;
  text: string;
  status: 'TODO' | 'DOING' | 'DONE';
  url?: string;
  github_url?: string;
  order: number; // 添加排序字段
  created_at: string;
  updated_at: string;
  user_id: string;
};

// 子任务类型
export type Subtask = {
  id: string;
  text: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  todo_id: string;
};

// 带子任务的待办事项类型
export type TodoWithSubtasks = Todo & {
  subtasks: Subtask[];
};
