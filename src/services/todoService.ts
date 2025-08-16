import { supabase } from '@/lib/supabase';
import type { Todo, Subtask, TodoWithSubtasks } from '@/lib/supabase';

export class TodoService {
  // 获取用户的所有待办事项
  static async getUserTodos(userId: string): Promise<TodoWithSubtasks[]> {
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        subtasks (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // 暂时只按创建时间排序

    if (error) {
      throw new Error(`获取待办事项失败: ${error.message}`);
    }

    // 如果数据中有 order 字段，按 order 排序；否则按创建时间排序
    const sortedData = data ? data.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }) : [];

    return sortedData;
  }

  // 创建新的待办事项
  static async createTodo(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .insert([todo])
      .select()
      .single();

    if (error) {
      throw new Error(`创建待办事项失败: ${error.message}`);
    }

    return data;
  }

  // 更新待办事项
  static async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新待办事项失败: ${error.message}`);
    }

    return data;
  }

  // 删除待办事项
  static async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除待办事项失败: ${error.message}`);
    }
  }

  // 创建子任务
  static async createSubtask(subtask: Omit<Subtask, 'id' | 'created_at' | 'updated_at'>): Promise<Subtask> {
    // 确保字段名映射正确
    const subtaskData = {
      text: subtask.text,
      is_completed: subtask.is_completed,
      todo_id: subtask.todo_id
    };

    const { data, error } = await supabase
      .from('subtasks')
      .insert([subtaskData])
      .select()
      .single();

    if (error) {
      throw new Error(`创建子任务失败: ${error.message}`);
    }

    return data;
  }

  // 更新子任务
  static async updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask> {
    console.log('TodoService.updateSubtask 被调用:', { id, updates });
    
    // 检查是否是本地ID（还未同步到数据库）
    if (id.startsWith('local_subtask_')) {
      console.warn('尝试更新本地子任务，跳过数据库操作:', id);
      // 返回一个模拟的更新结果，因为本地子任务还没有数据库ID
      return {
        id,
        text: updates.text || '',
        is_completed: updates.is_completed || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        todo_id: updates.todo_id || ''
      } as Subtask;
    }

    try {
      const { data, error } = await supabase
        .from('subtasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase 更新子任务失败:', error);
        throw new Error(`更新子任务失败: ${error.message}`);
      }

      if (!data) {
        console.error('更新子任务后没有返回数据');
        throw new Error('更新子任务失败: 没有返回数据');
      }

      console.log('子任务更新成功:', data);
      return data;
    } catch (err) {
      console.error('更新子任务时发生错误:', err);
      throw err;
    }
  }

  // 删除子任务
  static async deleteSubtask(id: string): Promise<void> {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除子任务失败: ${error.message}`);
    }
  }

  // 批量更新待办事项排序
  static async updateTodosOrder(todos: { id: string; order: number }[], userId: string): Promise<void> {
    if (todos.length === 0) return;

    // 首先获取所有待办事项的完整信息，确保包含 user_id
    const { data: existingTodos, error: fetchError } = await supabase
      .from('todos')
      .select('id, user_id')
      .in('id', todos.map(t => t.id));

    if (fetchError) {
      throw new Error(`获取待办事项信息失败: ${fetchError.message}`);
    }

    // 验证所有待办事项都属于当前用户
    const userTodos = existingTodos?.filter(todo => todo.user_id === userId);
    if (!userTodos || userTodos.length !== todos.length) {
      throw new Error('无法更新不属于当前用户的待办事项');
    }

    // 使用 update 而不是 upsert，确保只更新 order 字段
    for (const todo of todos) {
      const { error } = await supabase
        .from('todos')
        .update({ 
          order: todo.order,
          updated_at: new Date().toISOString()
        })
        .eq('id', todo.id)
        .eq('user_id', userId); // 确保只能更新自己的待办事项

      if (error) {
        throw new Error(`更新待办事项 ${todo.id} 排序失败: ${error.message}`);
      }
    }
  }

  // 批量更新子任务
  static async updateSubtasks(subtasks: Array<{ id: string; updates: Partial<Subtask> }>): Promise<void> {
    const updates = subtasks.map(({ id, updates }) => ({
      id,
      ...updates,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('subtasks')
      .upsert(updates);

    if (error) {
      throw new Error(`批量更新子任务失败: ${error.message}`);
    }
  }

  // 批量创建子任务
  static async createSubtasks(subtasks: Array<Omit<Subtask, 'id' | 'created_at' | 'updated_at'>>): Promise<Subtask[]> {
    if (subtasks.length === 0) return [];

    const subtasksData = subtasks.map(subtask => ({
      text: subtask.text,
      is_completed: subtask.is_completed,
      todo_id: subtask.todo_id
    }));

    const { data, error } = await supabase
      .from('subtasks')
      .insert(subtasksData)
      .select();

    if (error) {
      throw new Error(`批量创建子任务失败: ${error.message}`);
    }

    return data || [];
  }

  // 批量删除子任务
  static async deleteSubtasks(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from('subtasks')
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(`批量删除子任务失败: ${error.message}`);
    }
  }
}
