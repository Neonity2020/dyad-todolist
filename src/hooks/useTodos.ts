import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TodoService } from '@/services/todoService';
import type { Todo, Subtask, TodoWithSubtasks } from '@/lib/supabase';

// 本地编辑用的子任务类型
interface EditableSubtask {
  id: string;
  text: string;
  is_completed: boolean;
}

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
      
      console.log('=== 开始同步到数据库 ===');
      console.log('用户:', user.id);
      console.log('待同步操作数量:', pendingOperations.length);
      console.log('所有操作:', pendingOperations);

      // 按类型分组操作
      const createOps = pendingOperations.filter(op => op.type === 'CREATE');
      const updateOps = pendingOperations.filter(op => op.type === 'UPDATE');
      const deleteOps = pendingOperations.filter(op => op.type === 'DELETE');
      const reorderOps = pendingOperations.filter(op => op.type === 'REORDER');

      console.log('操作分组:', {
        创建: createOps.length,
        更新: updateOps.length,
        删除: deleteOps.length,
        重排序: reorderOps.length
      });

      // 执行创建操作
      const todoCreateOps = createOps.filter(op => op.data && 'user_id' in op.data);
      const subtaskCreateOps = createOps.filter(op => op.data && 'todo_id' in op.data);

      console.log('创建操作分组:', {
        待办事项: todoCreateOps.length,
        子任务: subtaskCreateOps.length
      });

      // 批量创建待办事项
      if (todoCreateOps.length > 0) {
        try {
          for (const op of todoCreateOps) {
            const newTodo = await TodoService.createTodo(op.data as CreateTodoData);
            // 更新本地ID
            setTodos(prev => prev.map(todo => 
              todo.id === op.id ? { ...todo, id: newTodo.id } : todo
            ));
            removeFromSyncQueue(op.id);
          }
        } catch (err) {
          console.error('Failed to create todos:', err);
        }
      }

      // 批量创建子任务
      if (subtaskCreateOps.length > 0) {
        try {
          console.log('开始创建子任务，数量:', subtaskCreateOps.length);
          for (const op of subtaskCreateOps) {
            console.log('创建子任务:', op);
            const newSubtask = await TodoService.createSubtask(op.data as CreateSubtaskData);
            console.log('子任务创建成功:', newSubtask);
            
            // 更新本地状态中的子任务ID
            setTodos(prev => prev.map(todo => {
              // 检查这个待办事项是否包含要更新的子任务
              const hasSubtask = todo.subtasks.some(subtask => subtask.id === op.id);
              if (hasSubtask) {
                return {
                  ...todo,
                  subtasks: todo.subtasks.map(subtask => 
                    subtask.id === op.id 
                      ? { ...subtask, id: newSubtask.id, created_at: newSubtask.created_at, updated_at: newSubtask.updated_at }
                      : subtask
                  )
                };
              }
              return todo;
            }));
            
            removeFromSyncQueue(op.id);
            console.log('子任务本地状态已更新，ID从', op.id, '更新为', newSubtask.id);
          }
        } catch (err) {
          console.error('创建子任务失败:', err);
          setError(err instanceof Error ? err.message : '创建子任务失败');
        }
      }

      // 执行更新操作
      for (const op of updateOps) {
        try {
          if (op.data) {
            console.log('=== 处理更新操作 ===');
            console.log('操作ID:', op.id);
            console.log('操作类型:', op.type);
            console.log('操作数据:', op.data);
            console.log('操作ID前缀:', op.id.substring(0, 20));
            
            // 简化判断逻辑：通过ID前缀判断是否为子任务
            const isSubtask = op.id.startsWith('local_subtask_') || 
                             (op.data && 'todo_id' in op.data) ||
                             (op.data && 'is_completed' in op.data && !('user_id' in op.data));
            
            console.log('判断为子任务:', isSubtask);
            console.log('判断依据:', {
              startsWithLocal: op.id.startsWith('local_subtask_'),
              hasTodoId: op.data && 'todo_id' in op.data,
              hasIsCompleted: op.data && 'is_completed' in op.data,
              hasUserId: op.data && 'user_id' in op.data
            });
            
            if (isSubtask) {
              // 检查是否是本地子任务（还未创建到数据库）
              if (op.id.startsWith('local_subtask_')) {
                console.warn('⚠️ 跳过本地子任务的更新操作，等待先创建:', op.id);
                console.log('继续处理下一个操作...');
                continue; // 跳过这个操作，等待创建完成后再处理
              }
              
              // 更新子任务
              console.log('🔄 开始更新子任务:', op.id, op.data);
              await TodoService.updateSubtask(op.id, op.data as Partial<Subtask>);
              console.log('✅ 子任务更新成功:', op.id);
            } else {
              // 更新待办事项
              console.log('🔄 开始更新待办事项:', op.id, op.data);
              await TodoService.updateTodo(op.id, op.data as Partial<Todo>);
              console.log('✅ 待办事项更新成功:', op.id);
            }
            removeFromSyncQueue(op.id);
            console.log('操作已从同步队列中移除:', op.id);
          }
        } catch (err) {
          console.error('❌ 更新操作失败:', err);
          console.error('失败的操作:', op);
          setError(err instanceof Error ? err.message : '更新操作失败');
        }
      }

      // 执行删除操作
      for (const op of deleteOps) {
        try {
          console.log('处理删除操作:', op);
          
          // 检查是待办事项还是子任务
          const isSubtask = op.id.startsWith('local_subtask_');
          console.log('判断为子任务:', isSubtask);
          
          if (isSubtask) {
            // 检查是否是本地子任务（还未创建到数据库）
            if (op.id.startsWith('local_subtask_')) {
              console.warn('跳过本地子任务的删除操作，等待先创建:', op.id);
              continue; // 跳过这个操作，等待创建完成后再处理
            }
            
            // 删除子任务
            console.log('开始删除子任务:', op.id);
            await TodoService.deleteSubtask(op.id);
            console.log('子任务删除成功:', op.id);
          } else {
            // 删除待办事项
            console.log('开始删除待办事项:', op.id);
            await TodoService.deleteTodo(op.id);
            console.log('待办事项删除成功:', op.id);
          }
          removeFromSyncQueue(op.id);
        } catch (err) {
          console.error('删除操作失败:', err, '操作:', op);
          setError(err instanceof Error ? err.message : '删除操作失败');
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

  // 子任务相关操作（只更新本地状态，不直接添加到同步队列）
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

      // 注意：不直接添加到同步队列，而是通过 onSyncSubtasks 回调处理
      return localSubtask;
    } catch (err) {
      console.error('Error creating subtask:', err);
      setError(err instanceof Error ? err.message : '创建子任务失败');
      throw err;
    }
  }, []);

  const updateSubtask = useCallback(async (id: string, updates: Partial<Subtask>) => {
    try {
      setTodos(prev => prev.map(todo => ({
        ...todo,
        subtasks: todo.subtasks.map(subtask => 
          subtask.id === id ? { ...subtask, ...updates, updated_at: new Date().toISOString() } : subtask
        )
      })));

      // 注意：不直接添加到同步队列，而是通过 onSyncSubtasks 回调处理
      return { id, ...updates } as Subtask;
    } catch (err) {
      console.error('Error updating subtask:', err);
      setError(err instanceof Error ? err.message : '更新子任务失败');
      throw err;
    }
  }, []);

  const deleteSubtask = useCallback(async (id: string) => {
    try {
      setTodos(prev => prev.map(todo => ({
        ...todo,
        subtasks: todo.subtasks.filter(subtask => subtask.id !== id)
      })));

      // 注意：不直接添加到同步队列，而是通过 onSyncSubtasks 回调处理
    } catch (err) {
      console.error('Error deleting subtask:', err);
      setError(err instanceof Error ? err.message : '删除子任务失败');
      throw err;
    }
  }, []);

  const toggleSubtask = useCallback(async (id: string, isCompleted: boolean) => {
    await updateSubtask(id, { is_completed: isCompleted });
  }, [updateSubtask]);

  // 同步子任务到数据库
  const syncSubtasks = useCallback(async (todoId: string, subtasks: EditableSubtask[]) => {
    try {
      console.log('=== 开始同步子任务 ===');
      console.log('Todo ID:', todoId);
      console.log('传入的子任务:', subtasks);
      console.log('当前 todos 状态:', todos);
      
      // 获取当前待办事项的子任务
      const currentTodo = todos.find(t => t.id === todoId);
      if (!currentTodo) {
        console.error('Todo not found:', todoId);
        return;
      }
      
      const currentSubtasks = currentTodo.subtasks;
      console.log('当前待办事项:', currentTodo);
      console.log('当前子任务:', currentSubtasks);
      
      // 找出新增的子任务
      const newSubtasks = subtasks.filter(subtask => 
        subtask.id.startsWith('local_subtask_')
      );
      
      // 找出更新的子任务（只包含已存在于数据库中的子任务）
      const updatedSubtasks = subtasks.filter(subtask => 
        !subtask.id.startsWith('local_subtask_') && 
        // 确保这个子任务在数据库中存在（通过检查是否有有效的UUID格式）
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subtask.id)
      );
      
      // 找出删除的子任务（只包含已存在于数据库中的子任务）
      const deletedSubtasks = currentSubtasks.filter(current => 
        !current.id.startsWith('local_subtask_') && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(current.id) &&
        !subtasks.some(updated => updated.id === current.id)
      );
      
      console.log('子任务操作分析:', {
        new: newSubtasks.length,
        updated: updatedSubtasks.length,
        deleted: deletedSubtasks.length,
        newSubtasks,
        updatedSubtasks,
        deletedSubtasks,
        totalSubtasks: subtasks.length,
        currentSubtasksCount: currentSubtasks.length
      });
      
      // 调试：显示所有子任务的ID格式
      console.log('子任务ID分析:', subtasks.map(s => ({
        id: s.id,
        isLocal: s.id.startsWith('local_subtask_'),
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id),
        length: s.id.length
      })));
      
      // 添加创建操作到同步队列
      for (const subtask of newSubtasks) {
        const operation = {
          id: subtask.id,
          type: 'CREATE' as const,
          data: {
            text: subtask.text,
            is_completed: subtask.is_completed,
            todo_id: todoId
          }
        };
        console.log('添加创建操作到同步队列:', operation);
        addToSyncQueue(operation);
      }
      
      // 添加更新操作到同步队列
      for (const subtask of updatedSubtasks) {
        const operation = {
          id: subtask.id,
          type: 'UPDATE' as const,
          data: {
            text: subtask.text,
            is_completed: subtask.is_completed
          }
        };
        console.log('添加更新操作到同步队列:', operation);
        addToSyncQueue(operation);
      }
      
      // 添加删除操作到同步队列
      for (const subtask of deletedSubtasks) {
        const operation = {
          id: subtask.id,
          type: 'DELETE' as const
        };
        console.log('添加删除操作到同步队列:', operation);
        addToSyncQueue(operation);
      }
      
      console.log('=== 子任务同步完成 ===');
      console.log('当前同步队列长度:', pendingOperations.length);
      
    } catch (err) {
      console.error('Error syncing subtasks:', err);
      setError(err instanceof Error ? err.message : '同步子任务失败');
    }
  }, [todos, addToSyncQueue, pendingOperations.length]);

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
