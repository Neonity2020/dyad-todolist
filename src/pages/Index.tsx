import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import TodoForm from "@/components/TodoForm";
import TodoItem from "@/components/TodoItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      status: "Todo",
      url: "",
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            My Todo List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TodoForm onAddTodo={addTodo} />
          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No todos yet! Add one above.
              </p>
            ) : (
              todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  id={todo.id}
                  text={todo.text}
                  status={todo.status}
                  url={todo.url}
                  subtasks={todo.subtasks} // Pass subtasks prop
                  onUpdateTodo={updateTodo}
                  onDelete={deleteTodo}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default Index;