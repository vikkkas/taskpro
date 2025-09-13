import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface EditTaskModalProps {
  task: Task;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  isLoading?: boolean;
}

export const EditTaskModal = ({ task, users, isOpen, onClose, onUpdateTask, isLoading = false }: EditTaskModalProps) => {
  const { user } = useAuth();

  // Handle assignee - convert object to string ID if needed
  const getAssigneeId = (assignee: any): string => {
    if (typeof assignee === 'string') {
      return assignee || 'unassigned';
    } else if (assignee && typeof assignee === 'object') {
      return assignee._id || assignee.id || 'unassigned';
    }
    return 'unassigned';
  };

  // Handle assignees - get array of IDs
  const getAssigneeIds = (assignees: any): string[] => {
    if (assignees && Array.isArray(assignees)) {
      return assignees.map(assignee => {
        if (typeof assignee === 'string') {
          return assignee;
        } else if (assignee && typeof assignee === 'object') {
          return assignee._id || assignee.id;
        }
        return '';
      }).filter(Boolean);
    }
    return [];
  };

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    assignee: getAssigneeId(task.assignee),
    assignees: getAssigneeIds(task.assignees),
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    tags: task.tags.join(', ')
  });


  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    const updates: Partial<Task> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      assignee: formData.assignee === 'unassigned' ? undefined : formData.assignee,
      assignees: formData.assignees,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    onUpdateTask(task._id, updates);
    onClose();

    toast({
      title: "Success",
      description: "Task updated successfully",
    });
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              id="description"
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Describe your task..."
              minHeight="80px"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="space-y-2">
              <Label>Assign To (Multiple)</Label>
              <MultiSelect
                options={users.map(u => ({
                  value: u._id || u.id || '',
                  label: u.name,
                  avatar: u.avatar,
                  department: u.department
                }))}
                value={formData.assignees}
                onChange={(value) => handleInputChange('assignees', value)}
                placeholder="Select team members..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="design, frontend, urgent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Task'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};