import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TodoService } from '@/services/todoService';
import type { Todo, Subtask, TodoWithSubtasks } from '@/lib/supabase';

// 定义操作类型和数据结构
type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER';

interface CreateTodoData {
  text: string;
  status: 'TODO' | 'DOING' | 'DONE';
  url: string;
  github_url: string;
  order: number;
  user_id: string;
}

interface CreateSubtaskData {
  text: string;
  is_completed: boolean;
  todo_id: string;
}

interface ReorderData {
  id: string;
  order: number;
}

type OperationData = CreateTodoData | CreateSubtaskData | Partial<Todo> | Partial<Subtask> | ReorderData[];

interface PendingOperation {
  id: string;
  type: OperationType;
  data?: OperationData;
  timestamp: number;
}

export const useTodos = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoWithSubtasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 同步相关状态
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // 初始加载
  const loadTodos = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Loading todos for user:', user.id);
      
      const data = await TodoService.getUserTodos(user.id);
      console.log('Todos loaded:', data);
      
      setTodos(data);
    } catch (err) {
      console.error('Error loading todos:', err);
      setError(err instanceof Error ? err.message : '加载待办事项失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 添加操作到同步队列
  const addToSyncQueue = useCallback((operation: Omit<PendingOperation, 'timestamp'>) => {
    const newOperation: PendingOperation = {
      ...operation,
      timestamp: Date.now()
    };
    
    setPendingOperations(prev => [...prev, newOperation]);
    console.log('Added to sync queue:', newOperation);
  }, []);

  // 从同步队列中移除操作
  const removeFromSyncQueue = useCallback((operationId: string) => {
    setPendingOperations(prev => prev.filter(op => op.id !== operationId));
  }, []);

  // 创建新的待办事项（本地操作）
  const createTodo = useCallback(async (text: string, url?: string, githubUrl?: string) => {
    if (!user) {
      throw new Error('用户未登录');
    }

    try {
      // 获取当前最大排序值（如果 order 字段存在）
      const maxOrder = todos.length > 0 && todos[0].order !== undefined 
        ? Math.max(...todos.map(t => t.order || 0)) 
        : -1;
      
      // 创建本地待办事项
      const localTodo: TodoWithSubtasks = {
        id: `local_${Date.now()}`, // 临时ID
        text,
        status: 'TODO',
        url: url || '',
        github_url: githubUrl || '',
        order: maxOrder + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
        subtasks: []
      };

      // 立即更新本地状态
      setTodos(prev => [localTodo, ...prev]);

      // 添加到同步队列
      addToSyncQueue({
        id: localTodo.id,
        type: 'CREATE',
        data: {
          text,
          status: 'TODO',
          url: url || '',
          github_url: githubUrl || '',
          order: maxOrder + 1,
          user_id: user.id
        }
      });

      return localTodo;
    } catch (err) {
      console.error('Error creating todo:', err);
      setError(err instanceof Error ? err.message : '创建待办事项失败');
      throw err;
    }
  }, [user, todos, addToSyncQueue]);

  // 更新待办事项（本地操作）
  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    try {
      // 立即更新本地状态
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, ...updates, updated_at: new Date().toISOString() } : todo
      ));

      // 添加到同步队列
      addToSyncQueue({
        id,
        type: 'UPDATE',
        data: updates
      });

      return { id, ...updates } as Todo;
    } catch (err) {
      console.error('Error updating todo:', err);
      setError(err instanceof Error ? err.message : '更新待办事项失败');
      throw err;
    }
  }, [addToSyncQueue]);

  // 删除待办事项（本地操作）
  const deleteTodo = useCallback(async (id: string) => {
    try {
      // 立即从本地状态移除
      setTodos(prev => prev.filter(todo => todo.id !== id));

      // 添加到同步队列
      addToSyncQueue({
        id,
        type: 'DELETE'
      });
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError(err instanceof Error ? err.message : '删除待办事项失败');
      throw err;
    }
  }, [addToSyncQueue]);

  // 更新待办事项排序（本地操作）
  const updateTodosOrder = useCallback(async (newOrder: TodoWithSubtasks[]) => {
    if (!user) {
      setError('用户未登录，无法更新排序');
      return;
    }

    try {
      // 立即更新本地状态
      setTodos(newOrder);

      // 添加到同步队列
      addToSyncQueue({
        id: `reorder_${Date.now()}`,
        type: 'REORDER',
        data: newOrder.map((todo, index) => ({
          id: todo.id,
          order: index
        }))
      });
    } catch (err) {
      console.error('更新排序失败:', err);
      setError(err instanceof Error ? err.message : '更新排序失败');
    }
  }, [user, addToSyncQueue]);

  // 同步所有待同步操作到数据库
  const syncToDatabase = useCallback(async () => {
    if (!user || pendingOperations.length === 0) return;

    try {
      setSyncing(true);
      setError(null);
      console.log('Starting sync with operations:', pendingOperations);

      // 按类型分组操作
      const createOps = pendingOperations.filter(op => op.type === 'CREATE');
      const updateOps = pendingOperations.filter(op => op.type === 'UPDATE');
      const deleteOps = pendingOperations.filter(op => op.type === 'DELETE');
      const reorderOps = pendingOperations.filter(op => op.type === 'REORDER');

      // 执行创建操作
      for (const op of createOps) {
        try {
          if (op.data && 'text' in op.data && 'status' in op.data) {
            const newTodo = await TodoService.createTodo(op.data as CreateTodoData);
            // 更新本地ID
            setTodos(prev => prev.map(todo => 
              todo.id === op.id ? { ...todo, id: newTodo.id } : todo
            ));
            removeFromSyncQueue(op.id);
          }
        } catch (err) {
          console.error('Failed to create todo:', err);
        }
      }

      // 执行更新操作
      for (const op of updateOps) {
        try {
          if (op.data) {
            await TodoService.updateTodo(op.id, op.data as Partial<Todo>);
            removeFromSyncQueue(op.id);
          }
        } catch (err) {
          console.error('Failed to update todo:', err);
        }
      }

      // 执行删除操作
      for (const op of deleteOps) {
        try {
          await TodoService.deleteTodo(op.id);
          removeFromSyncQueue(op.id);
        } catch (err) {
          console.error('Failed to delete todo:', err);
        }
      }

      // 执行重排序操作
      for (const op of reorderOps) {
        try {
          if (Array.isArray(op.data)) {
            await TodoService.updateTodosOrder(op.data as ReorderData[], user.id);
            removeFromSyncQueue(op.id);
          }
        } catch (err) {
          console.error('Failed to reorder todos:', err);
        }
      }

      // 重新加载数据以确保一致性
      await loadTodos();
      
      setLastSyncTime(new Date());
      console.log('Sync completed successfully');
    } catch (err) {
      console.error('Sync failed:', err);
      setError(err instanceof Error ? err.message : '同步失败');
    } finally {
      setSyncing(false);
    }
  }, [user, pendingOperations, removeFromSyncQueue, loadTodos]);

  // 强制同步（忽略错误）
  const forceSync = useCallback(async () => {
    if (!user || pendingOperations.length === 0) return;

    try {
      setSyncing(true);
      setError(null);
      
      // 清空所有待同步操作
      setPendingOperations([]);
      
      // 重新加载数据
      await loadTodos();
      
      setLastSyncTime(new Date());
      console.log('Force sync completed');
    } catch (err) {
      console.error('Force sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }, [user, pendingOperations, loadTodos]);

  // 子任务相关操作（保持原有逻辑，但添加到同步队列）
  const createSubtask = useCallback(async (todoId: string, text: string) => {
    try {
      const localSubtask: Subtask = {
        id: `local_subtask_${Date.now()}`,
        text,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        todo_id: todoId
      };

      setTodos(prev => prev.map(todo => 
        todo.id === todoId 
          ? { ...todo, subtasks: [...todo.subtasks, localSubtask] }
          : todo
      ));

      addToSyncQueue({
        id: localSubtask.id,
        type: 'CREATE',
        data: {
          text,
          is_completed: false,
          todo_id: todoId
        }
      });

      return localSubtask;
    } catch (err) {
      console.error('Error creating subtask:', err);
      setError(err instanceof Error ? err.message : '创建子任务失败');
      throw err;
    }
  }, [addToSyncQueue]);

  const updateSubtask = useCallback(async (id: string, updates: Partial<Subtask>) => {
    try {
      setTodos(prev => prev.map(todo => ({
        ...todo,
        subtasks: todo.subtasks.map(subtask => 
          subtask.id === id ? { ...subtask, ...updates, updated_at: new Date().toISOString() } : subtask
        )
      })));

      addToSyncQueue({
        id,
        type: 'UPDATE',
        data: updates
      });

      return { id, ...updates } as Subtask;
    } catch (err) {
      console.error('Error updating subtask:', err);
      setError(err instanceof Error ? err.message : '更新子任务失败');
      throw err;
    }
  }, [addToSyncQueue]);

  const deleteSubtask = useCallback(async (id: string) => {
    try {
      setTodos(prev => prev.map(todo => ({
        ...todo,
        subtasks: todo.subtasks.filter(subtask => subtask.id !== id)
      })));

      addToSyncQueue({
        id,
        type: 'DELETE'
      });
    } catch (err) {
      console.error('Error deleting subtask:', err);
      setError(err instanceof Error ? err.message : '删除子任务失败');
      throw err;
    }
  }, [addToSyncQueue]);

  const toggleSubtask = useCallback(async (id: string, isCompleted: boolean) => {
    await updateSubtask(id, { is_completed: isCompleted });
  }, [updateSubtask]);

  // 同步子任务到数据库
  const syncSubtasks = useCallback(async (todoId: string, subtasks: Subtask[]) => {
    try {
      console.log('Syncing subtasks for todo:', todoId, subtasks);
      
      // 这里可以添加批量同步逻辑
      // 暂时只记录日志，实际同步逻辑需要根据具体需求实现
      
    } catch (err) {
      console.error('Error syncing subtasks:', err);
      setError(err instanceof Error ? err.message : '同步子任务失败');
    }
  }, []);

  // 初始加载
  useEffect(() => {
    if (user) {
      loadTodos();
    } else {
      setLoading(false);
    }
  }, [user, loadTodos]);

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtask,
    syncSubtasks,
    updateTodosOrder,
    refreshTodos: loadTodos,
    // 同步相关
    pendingOperations,
    syncing,
    lastSyncTime,
    syncToDatabase,
    forceSync,
    hasPendingChanges: pendingOperations.length > 0
  };
};
