import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Info, X } from "lucide-react"; // Added X for subtask delete
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox for subtasks

type TodoStatus = "Todo" | "Doing" | "Done";

interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface TodoItemProps {
  id: string;
  text: string;
  status: TodoStatus;
  url?: string;
  subtasks: Subtask[]; // Added subtasks prop
  onUpdateTodo: (id: string, updates: { status?: TodoStatus; url?: string; text?: string; subtasks?: Subtask[] }) => void;
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
  url,
  subtasks, // Destructure subtasks
  onUpdateTodo,
  onDelete,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editedUrl, setEditedUrl] = useState(url || "");
  const [editedText, setEditedText] = useState(text);
  const [editedSubtasks, setEditedSubtasks] = useState<Subtask[]>(subtasks); // State for subtasks
  const [newSubtaskText, setNewSubtaskText] = useState(""); // State for new subtask input

  useEffect(() => {
    setEditedUrl(url || "");
  }, [url]);

  useEffect(() => {
    setEditedText(text);
  }, [text]);

  useEffect(() => {
    setEditedSubtasks(subtasks); // Update editedSubtasks when subtasks prop changes
  }, [subtasks]);

  const handleStatusChange = (newStatus: TodoStatus) => {
    onUpdateTodo(id, { status: newStatus, url: editedUrl, text: editedText, subtasks: editedSubtasks });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setEditedUrl(newUrl);
    onUpdateTodo(id, { url: newUrl, status: status, text: editedText, subtasks: editedSubtasks });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setEditedText(newText);
    onUpdateTodo(id, { text: newText, status: status, url: editedUrl, subtasks: editedSubtasks });
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      const newSubtask: Subtask = {
        id: Date.now().toString(),
        text: newSubtaskText.trim(),
        isCompleted: false,
      };
      const updatedSubtasks = [...editedSubtasks, newSubtask];
      setEditedSubtasks(updatedSubtasks);
      onUpdateTodo(id, { subtasks: updatedSubtasks, text: editedText, status: status, url: editedUrl });
      setNewSubtaskText("");
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = editedSubtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, isCompleted: !subtask.isCompleted } : subtask
    );
    setEditedSubtasks(updatedSubtasks);
    onUpdateTodo(id, { subtasks: updatedSubtasks, text: editedText, status: status, url: editedUrl });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = editedSubtasks.filter((subtask) => subtask.id !== subtaskId);
    setEditedSubtasks(updatedSubtasks);
    onUpdateTodo(id, { subtasks: updatedSubtasks, text: editedText, status: status, url: editedUrl });
  };

  // Function to strip "https://" or "http://" from the URL for display
  const displayUrl = url ? url.replace(/^(https?:\/\/)/, '') : '';

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex items-center justify-between p-3 border-b last:border-b-0">
            <div className="flex flex-col items-start flex-grow">
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
                  className="text-blue-500 hover:underline text-xs truncate max-w-[200px] mt-1 ml-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayUrl}
                </a>
              )}
              {/* Subtasks display in the list */}
              {editedSubtasks.length > 0 && (
                <div className="mt-2 ml-6 w-full space-y-1">
                  {editedSubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`list-subtask-${subtask.id}`}
                        checked={subtask.isCompleted}
                        onCheckedChange={() => handleToggleSubtask(subtask.id)}
                      />
                      <label
                        htmlFor={`list-subtask-${subtask.id}`}
                        className={cn(
                          "text-sm",
                          subtask.isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {subtask.text}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={status}
                onValueChange={handleStatusChange}
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
              <Input
                type="text"
                value={editedText}
                onChange={handleTextChange}
                className="mt-1"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <Select
                value={status}
                onValueChange={handleStatusChange}
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
                onChange={handleUrlChange}
                className="mt-1"
              />
            </div>
            {/* Subtasks Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Subtasks</h3>
              <div className="space-y-2">
                {editedSubtasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No subtasks yet.</p>
                ) : (
                  editedSubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`subtask-${subtask.id}`}
                          checked={subtask.isCompleted}
                          onCheckedChange={() => handleToggleSubtask(subtask.id)}
                        />
                        <label
                          htmlFor={`subtask-${subtask.id}`}
                          className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                            subtask.isCompleted && "line-through text-muted-foreground"
                          )}
                        >
                          {subtask.text}
                        </label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="h-7 w-7"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex space-x-2 mt-4">
                <Input
                  type="text"
                  placeholder="Add a new subtask..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); // Prevent form submission
                      handleAddSubtask();
                    }
                  }}
                  className="flex-grow"
                />
                <Button onClick={handleAddSubtask}>Add Subtask</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TodoItem;