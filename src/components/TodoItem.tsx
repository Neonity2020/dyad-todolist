import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TodoStatus = "Todo" | "Doing" | "Done";

interface TodoItemProps {
  id: string;
  text: string;
  status: TodoStatus;
  onStatusChange: (id: string, status: TodoStatus) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  Todo: "bg-gray-100 text-gray-800",
  Doing: "bg-blue-100 text-blue-800",
  Done: "bg-green-100 text-green-800",
};

const TodoItem: React.FC<TodoItemProps> = ({
  id,
  text,
  status,
  onStatusChange,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div className="flex items-center space-x-3 flex-grow">
        <div className={cn(
          "px-3 py-1 rounded-full text-sm font-medium",
          statusColors[status]
        )}>
          {text}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Select
          value={status}
          onValueChange={(value: TodoStatus) => onStatusChange(id, value)}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todo">Todo</SelectItem>
            <SelectItem value="Doing">Doing</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
          <Trash2 className="h-5 w-5 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

export default TodoItem;