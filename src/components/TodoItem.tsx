import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input"; // Import Input component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type TodoStatus = "Todo" | "Doing" | "Done";

interface TodoItemProps {
  id: string;
  text: string;
  status: TodoStatus;
  url?: string; // Added URL prop
  onUpdateTodo: (id: string, updates: { status?: TodoStatus; url?: string }) => void; // Updated prop
  onDelete: (id: string) => void;
}

const statusColors = {
  Todo: "bg-gray-100 text-gray-800",
  Doing: "bg-blue-100 text-blue-800",
  Done: "bg-green-100 text-green-800",
};

const statusLabels = {
  Todo: "To Do",
  Doing: "In Progress",
  Done: "Completed"
};

const TodoItem: React.FC<TodoItemProps> = ({
  id,
  text,
  status,
  url, // Destructure URL prop
  onUpdateTodo, // Destructure updated prop
  onDelete,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editedUrl, setEditedUrl] = useState(url || ""); // State for URL input

  useEffect(() => {
    setEditedUrl(url || ""); // Update editedUrl when url prop changes
  }, [url]);

  const handleStatusChange = (newStatus: TodoStatus) => {
    onUpdateTodo(id, { status: newStatus, url: editedUrl });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setEditedUrl(newUrl);
    onUpdateTodo(id, { url: newUrl, status: status });
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex items-center justify-between p-3 border-b last:border-b-0">
            <div className="flex items-center space-x-3 flex-grow">
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                statusColors[status]
              )}>
                {text}
              </div>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm truncate max-w-[150px]"
                  onClick={(e) => e.stopPropagation()} // Prevent context menu on click
                >
                  {url}
                </a>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={status}
                onValueChange={handleStatusChange} // Use new handler
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-5 w-5 text-red-500" />
              </Button>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setShowDetailsDialog(true)}>
            <Info className="mr-2 h-4 w-4" />
            Task Details
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task "{text}" and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Task</h3>
              <p className="text-lg">{text}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <Select
                value={status}
                onValueChange={handleStatusChange} // Use new handler
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="Doing">Doing</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
              <Input
                type="url"
                placeholder="Add a URL (optional)"
                value={editedUrl}
                onChange={handleUrlChange} // Handle URL changes
                className="mt-1"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TodoItem;