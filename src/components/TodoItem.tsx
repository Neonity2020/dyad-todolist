import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Info, X, Edit2, Check, X as XIcon, GripVertical } from "lucide-react"; // Added GripVertical for drag handle
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

import type { Subtask } from "@/lib/supabase";

type TodoStatus = "TODO" | "DOING" | "DONE";

// 本地编辑用的子任务类型
interface EditableSubtask {
  id: string;
  text: string;
  is_completed: boolean;
}

interface TodoItemProps {
  id: string;
  text: string;
  status: TodoStatus;
  url?: string;
  githubUrl?: string; // Added GitHub URL prop
  subtasks: Subtask[]; // Added subtasks prop
  onUpdateTodo: (id: string, updates: { status?: TodoStatus; url?: string; githubUrl?: string; text?: string; subtasks?: EditableSubtask[] }) => void;
  onDelete: (id: string) => void;
  onSyncSubtasks?: (todoId: string, subtasks: Subtask[]) => void; // 新增子任务同步回调
}

const statusColors = {
  TODO: "bg-gray-100 text-gray-800",
  DOING: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
};

const statusLabels = {
  TODO: "To Do",
  DOING: "In Progress",
  DONE: "Completed"
};

const TodoItem: React.FC<TodoItemProps> = ({
  id,
  text,
  status,
  url,
  githubUrl, // Destructure GitHub URL
  subtasks, // Destructure subtasks
  onUpdateTodo,
  onDelete,
  onSyncSubtasks,
}) => {
  // Sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editedUrl, setEditedUrl] = useState(url || "");
  const [editedGitHubUrl, setEditedGitHubUrl] = useState(githubUrl || ""); // State for GitHub URL
  const [editedText, setEditedText] = useState(text);
  const [editedSubtasks, setEditedSubtasks] = useState<EditableSubtask[]>(
    subtasks.map(s => ({ id: s.id, text: s.text, is_completed: s.is_completed }))
  ); // State for subtasks
  const [newSubtaskText, setNewSubtaskText] = useState(""); // State for new subtask input
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null); // State for editing subtask
  const [editingSubtaskText, setEditingSubtaskText] = useState(""); // State for editing subtask text

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
    onUpdateTodo(id, mapFieldsForUpdate({ status: newStatus, url: editedUrl, githubUrl: editedGitHubUrl, text: editedText, subtasks: editedSubtasks }));
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setEditedUrl(newUrl);
    onUpdateTodo(id, mapFieldsForUpdate({ url: newUrl, status: status, githubUrl: editedGitHubUrl, text: editedText, subtasks: editedSubtasks }));
  };

  const handleGitHubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGitHubUrl = e.target.value;
    setEditedGitHubUrl(newGitHubUrl);
    onUpdateTodo(id, mapFieldsForUpdate({ githubUrl: newGitHubUrl, status: status, text: editedText, url: editedUrl, subtasks: editedSubtasks }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setEditedText(newText);
    onUpdateTodo(id, mapFieldsForUpdate({ text: newText, status: status, url: editedUrl, githubUrl: editedGitHubUrl, subtasks: editedSubtasks }));
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      const newSubtask: EditableSubtask = {
        id: Date.now().toString(),
        text: newSubtaskText.trim(),
        is_completed: false,
      };
      const updatedSubtasks = [...editedSubtasks, newSubtask];
      setEditedSubtasks(updatedSubtasks);
      // 同步子任务到数据库
      if (onSyncSubtasks) {
        onSyncSubtasks(id, updatedSubtasks as Subtask[]);
      }
      setNewSubtaskText("");
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = editedSubtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, is_completed: !subtask.is_completed } : subtask
    );
    setEditedSubtasks(updatedSubtasks);
    // 同步子任务到数据库
    if (onSyncSubtasks) {
      onSyncSubtasks(id, updatedSubtasks as Subtask[]);
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = editedSubtasks.filter((subtask) => subtask.id !== subtaskId);
    setEditedSubtasks(updatedSubtasks);
    // 同步子任务到数据库
    if (onSyncSubtasks) {
      onSyncSubtasks(id, updatedSubtasks as Subtask[]);
    }
  };

  const handleEditSubtask = (subtaskId: string, currentText: string) => {
    setEditingSubtaskId(subtaskId);
    setEditingSubtaskText(currentText);
  };

  const handleSaveSubtaskEdit = (subtaskId: string) => {
    if (editingSubtaskText.trim()) {
      const updatedSubtasks = editedSubtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, text: editingSubtaskText.trim() } : subtask
      );
      setEditedSubtasks(updatedSubtasks);
      // 同步子任务到数据库
      if (onSyncSubtasks) {
        onSyncSubtasks(id, updatedSubtasks as Subtask[]);
      }
    }
    setEditingSubtaskId(null);
    setEditingSubtaskText("");
  };

  const handleCancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskText("");
  };

  // 字段名映射函数：将前端字段名转换为数据库字段名
  const mapFieldsForUpdate = (updates: { status?: TodoStatus; url?: string; githubUrl?: string; text?: string; subtasks?: EditableSubtask[] }) => {
    const mappedUpdates: { status?: TodoStatus; url?: string; github_url?: string; text?: string } = {};
    
    if (updates.status !== undefined) mappedUpdates.status = updates.status;
    if (updates.text !== undefined) mappedUpdates.text = updates.text;
    if (updates.url !== undefined) mappedUpdates.url = updates.url;
    if (updates.githubUrl !== undefined) mappedUpdates.github_url = updates.githubUrl; // 映射字段名
    
    // 注意：subtasks 不包含在映射中，因为它是关联表，不是 todos 表的直接字段
    
    return mappedUpdates;
  };

  // Function to strip "https://" or "http://" from the URL for display
  const displayUrl = url ? url.replace(/^(https?:\/\/)/, '') : '';

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            ref={setNodeRef}
            style={style}
            className={cn(
              "flex flex-col p-3 border-b last:border-b-0 group relative",
              isDragging && "opacity-0"
            )}
          >
            {/* Top row: Task title, status, and delete button */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium flex-shrink-0",
                  statusColors[status]
                )}>
                  {text}
                </div>
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
                    <SelectItem value="TODO">Todo</SelectItem>
                    <SelectItem value="DOING">Doing</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
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
            
            {/* Bottom row: URLs and subtasks */}
            <div className="flex flex-col items-start flex-grow">
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-xs truncate max-w-[200px] mt-1 ml-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  🌐 {displayUrl}
                </a>
              )}
              {editedGitHubUrl && (
                <a
                  href={editedGitHubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline text-xs truncate max-w-[200px] mt-1 ml-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  🐙 {editedGitHubUrl.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}
                </a>
              )}
              {/* Subtasks display in the list */}
              {editedSubtasks.length > 0 && (
                <div className="mt-2 ml-6 max-w-[calc(100%-1.5rem)] space-y-1">
                  {editedSubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`list-subtask-${subtask.id}`}
                        checked={subtask.is_completed}
                        onCheckedChange={() => handleToggleSubtask(subtask.id)}
                      />
                      {editingSubtaskId === subtask.id ? (
                        <div className="flex items-center space-x-2 flex-grow">
                          <Input
                            type="text"
                            value={editingSubtaskText}
                            onChange={(e) => setEditingSubtaskText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveSubtaskEdit(subtask.id);
                              }
                            }}
                            className="flex-grow text-sm h-6"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveSubtaskEdit(subtask.id)}
                            className="h-6 w-6 text-green-600 hover:text-green-700"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelSubtaskEdit}
                            className="h-6 w-6 text-gray-600 hover:text-gray-700"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 flex-grow min-w-0">
                          <label
                            htmlFor={`list-subtask-${subtask.id}`}
                            className={cn(
                              "text-sm flex-grow truncate min-w-0",
                              subtask.is_completed && "line-through text-muted-foreground"
                            )}
                          >
                            {subtask.text}
                          </label>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSubtask(subtask.id, subtask.text)}
                            className="h-5 w-5 text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 w-full overflow-y-auto max-h-[80vh]"> {/* Added overflow-y-auto and max-h-[80vh] */}
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
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">GitHub Project</h3>
              <Input
                type="url"
                placeholder="https://github.com/username/repository"
                value={editedGitHubUrl}
                onChange={handleGitHubUrlChange}
                className="mt-1"
              />
            </div>
            {/* Subtasks Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Subtasks</h3>
              <div className="space-y-2 w-full overflow-hidden">
                {editedSubtasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No subtasks yet.</p>
                ) : (
                  editedSubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex flex-col space-y-2 p-3 border rounded-lg w-full overflow-hidden">
                      <div className="flex items-center space-x-2 w-full min-w-0">
                        <Checkbox
                          id={`subtask-${subtask.id}`}
                          checked={subtask.is_completed}
                          onCheckedChange={() => handleToggleSubtask(subtask.id)}
                          className="flex-shrink-0"
                        />
                        {editingSubtaskId === subtask.id ? (
                          <div className="flex items-center space-x-2 w-full min-w-0">
                            <Input
                              type="text"
                              value={editingSubtaskText}
                              onChange={(e) => setEditingSubtaskText(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveSubtaskEdit(subtask.id);
                                }
                              }}
                              className="flex-1 text-sm min-w-0"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveSubtaskEdit(subtask.id)}
                              className="h-7 w-7 text-green-600 hover:text-green-700 flex-shrink-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelSubtaskEdit}
                              className="h-7 w-7 text-gray-600 hover:text-gray-700 flex-shrink-0"
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 w-full min-w-0">
                            <label
                              htmlFor={`subtask-${subtask.id}`}
                              className={cn(
                                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 min-w-0 truncate",
                                subtask.is_completed && "line-through text-muted-foreground"
                              )}
                            >
                              {subtask.text}
                            </label>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSubtask(subtask.id, subtask.text)}
                                className="h-7 w-7 text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSubtask(subtask.id)}
                                className="h-7 w-7 text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
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
                  className="flex-1 min-w-0"
                />
                <Button onClick={handleAddSubtask} className="flex-shrink-0">Add Subtask</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TodoItem;