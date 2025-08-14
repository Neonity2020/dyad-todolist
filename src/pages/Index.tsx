import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import TodoForm from "@/components/TodoForm";
import TodoItem from "@/components/TodoItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TodoStatus = "Todo" | "Doing" | "Done";

interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
}

const Index: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem("todos");
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      status: "Todo",
    };
    setTodos((prevTodos) => [...prevTodos, newTodo]);
  };

  const updateStatus = (id: string, status: TodoStatus) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, status } : todo
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
                  onStatusChange={updateStatus}
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