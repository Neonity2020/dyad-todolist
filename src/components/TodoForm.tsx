import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TodoFormProps {
  onAddTodo: (text: string) => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ onAddTodo }) => {
  const [newTodoText, setNewTodoText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      onAddTodo(newTodoText.trim());
      setNewTodoText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2 mb-6">
      <Input
        type="text"
        placeholder="Add a new todo..."
        value={newTodoText}
        onChange={(e) => setNewTodoText(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit">
        <Plus className="h-5 w-5 mr-2" /> Add
      </Button>
    </form>
  );
};

export default TodoForm;