import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import TodoForm from "@/components/TodoForm";
import TodoItem from "@/components/TodoItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, LogOut, User, RefreshCw, Bug } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTodos } from "@/hooks/useTodos";
import { useNavigate } from "react-router-dom";
import { debugAuth, checkDatabaseStructure } from "@/utils/debugAuth";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { TodoWithSubtasks } from "@/lib/supabase";

type TodoStatus = "TODO" | "DOING" | "DONE";

const Index: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    syncSubtasks,
    updateTodosOrder,
    refreshTodos,
    // 同步相关
    pendingOperations,
    syncing,
    lastSyncTime,
    syncToDatabase,
    forceSync,
    hasPendingChanges
  } = useTodos();
  
  // 添加筛选状态
  const [statusFilter, setStatusFilter] = useState<TodoStatus | "All">("All");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // 筛选任务函数
  const filteredTodos = todos.filter(todo => {
    if (statusFilter === "All") return true;
    return todo.status === statusFilter;
  });

  const addTodo = async (text: string) => {
    try {
      await createTodo(text);
    } catch (err) {
      console.error('创建待办事项失败:', err);
    }
  };

  const updateTodoItem = async (id: string, updates: Partial<TodoWithSubtasks>) => {
    try {
      await updateTodo(id, updates);
    } catch (err) {
      console.error('更新待办事项失败:', err);
    }
  };

  const deleteTodoItem = async (id: string) => {
    try {
      await deleteTodo(id);
    } catch (err) {
      console.error('删除待办事项失败:', err);
    }
  };

  // 获取各状态的任务数量
  const getStatusCount = (status: TodoStatus) => {
    return todos.filter(todo => todo.status === status).length;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleDebugAuth = async () => {
    console.log('=== 开始调试认证状态 ===');
    await debugAuth();
    await checkDatabaseStructure();
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // 计算新的排序
      const oldIndex = filteredTodos.findIndex(todo => todo.id === active.id);
      const newIndex = filteredTodos.findIndex(todo => todo.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 使用 arrayMove 重新排序
        const newOrder = arrayMove(filteredTodos, oldIndex, newIndex);
        
        // 更新数据库中的排序
        updateTodosOrder(newOrder);
        
        console.log('拖拽排序完成:', { from: oldIndex, to: newIndex });
      }
    }
    
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // 显示错误信息
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={refreshTodos} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button onClick={handleDebugAuth} variant="outline" className="w-full">
                  <Bug className="h-4 w-4 mr-2" />
                  调试认证状态
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold text-center flex-1">
              Dyad Todo List by Neonity
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugAuth}
                className="text-yellow-600 hover:text-yellow-700 border-yellow-200 hover:border-yellow-300"
                title="调试认证状态"
              >
                <Bug className="h-4 w-4" />
              </Button>
              {/* 同步按钮 */}
              {hasPendingChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={syncToDatabase}
                  disabled={syncing}
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                  title={`${pendingOperations.length} 个操作待同步`}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                  同步 ({pendingOperations.length})
                </Button>
              )}
              
              {/* 强制同步按钮 */}
              {hasPendingChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceSync}
                  disabled={syncing}
                  className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                  title="强制同步（忽略错误）"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  强制同步
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={refreshTodos}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-1" />
                登出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TodoForm onAddTodo={addTodo} />
          
          {/* 状态筛选器 */}
          <div className="mb-4 flex flex-wrap gap-2 justify-center">
            <Button
              variant={statusFilter === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("All")}
              className="text-xs"
            >
              All ({todos.length})
            </Button>
            <Button
              variant={statusFilter === "TODO" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("TODO")}
              className="text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Todo ({getStatusCount("TODO")})
            </Button>
            <Button
              variant={statusFilter === "DOING" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("DOING")}
              className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
            >
              Doing ({getStatusCount("DOING")})
            </Button>
            <Button
              variant={statusFilter === "DONE" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("DONE")}
              className="text-xs bg-green-100 text-green-800 hover:bg-green-200 dark:bg-blue-900 dark:text-green-200 dark:hover:bg-green-800"
            >
              Done ({getStatusCount("DONE")})
            </Button>
          </div>

          {/* 同步状态指示器 */}
          {hasPendingChanges && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    {pendingOperations.length} 个操作待同步
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={syncToDatabase}
                    disabled={syncing}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                    同步
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceSync}
                    disabled={syncing}
                    className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300 text-xs"
                  >
                    强制同步
                  </Button>
                </div>
              </div>
              {lastSyncTime && (
                <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                  上次同步: {lastSyncTime.toLocaleString()}
                </div>
              )}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={filteredTodos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                ) : filteredTodos.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    {todos.length === 0 ? "No todos yet! Add one above." : `No ${statusFilter === "All" ? "" : statusFilter} todos found.`}
                  </p>
                ) : (
                  filteredTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      id={todo.id}
                      text={todo.text}
                      status={todo.status}
                      url={todo.url}
                      githubUrl={todo.github_url}
                      subtasks={todo.subtasks}
                      onUpdateTodo={updateTodoItem}
                      onDelete={deleteTodoItem}
                      onSyncSubtasks={syncSubtasks}
                    />
                  ))
                )}
              </div>
            </SortableContext>
            
            <DragOverlay>
              {activeId ? (
                <div className="flex flex-col p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-lg opacity-90">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-gray-400">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700">
                        {todos.find(todo => todo.id === activeId)?.text}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default Index;