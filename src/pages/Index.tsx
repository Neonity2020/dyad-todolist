import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import TodoForm from "@/components/TodoForm";
import TodoItem from "@/components/TodoItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
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
  useSortable,
} from '@dnd-kit/sortable';

type TodoStatus = "Todo" | "Doing" | "Done";

interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
  url?: string;
  githubUrl?: string; // Added GitHub URL
  subtasks: Subtask[]; // Added subtasks
}

const Index: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem("todos");
    const parsedTodos = savedTodos ? JSON.parse(savedTodos) : [];
    // Ensure subtasks are initialized for existing todos if not present
    return parsedTodos.map((todo: Todo) => ({
      ...todo,
      subtasks: todo.subtasks || [], // Ensure subtasks array exists
    }));
  });

  // 添加筛选状态
  const [statusFilter, setStatusFilter] = useState<TodoStatus | "All">("All");

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // 筛选任务函数
  const filteredTodos = todos.filter(todo => {
    if (statusFilter === "All") return true;
    return todo.status === statusFilter;
  });

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      status: "Todo",
      url: "",
      githubUrl: "", // Initialize GitHub URL
      subtasks: [], // Initialize subtasks
    };
    setTodos((prevTodos) => [...prevTodos, newTodo]);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, ...updates } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  // 获取各状态的任务数量
  const getStatusCount = (status: TodoStatus) => {
    return todos.filter(todo => todo.status === status).length;
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg shadow-lg"> {/* Changed max-w-md to max-w-lg */}
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Dyad Todo List by Neonity
          </CardTitle>
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
              variant={statusFilter === "Todo" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Todo")}
              className="text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Todo ({getStatusCount("Todo")})
            </Button>
            <Button
              variant={statusFilter === "Doing" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Doing")}
              className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
            >
              Doing ({getStatusCount("Doing")})
            </Button>
            <Button
              variant={statusFilter === "Done" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Done")}
              className="text-xs bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
            >
              Done ({getStatusCount("Done")})
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={filteredTodos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {filteredTodos.length === 0 ? (
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
                      githubUrl={todo.githubUrl} // Pass GitHub URL prop
                      subtasks={todo.subtasks} // Pass subtasks prop
                      onUpdateTodo={updateTodo}
                      onDelete={deleteTodo}
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