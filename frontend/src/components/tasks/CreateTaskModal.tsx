import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskPriority } from '@/types/task';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  onCreateTask: (task: {
    title: string;
    description: string;
    priority: TaskPriority;
    assignee: string;
    dueDate?: string;
    tags: string[];
  }) => void;
  isLoading?: boolean;
}

export const CreateTaskModal = ({ open, onOpenChange, users, onCreateTask, isLoading = false }: CreateTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to get user ID (handles both _id and id)
  const getUserId = (user: User): string => user._id || user.id || '';
  const getUserName = (userId: string): string => {
    if (!users || users.length === 0) return 'Unknown User';
    const foundUser = users.find(u => getUserId(u) === userId);
    return foundUser?.name || 'Unknown User';
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    const taskAssignee = user?.role === 'admin' && assignee && assignee !== 'unassigned' ? assignee : getUserId(user!);

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee: assignee === 'unassigned' ? '' : taskAssignee,
      dueDate: dueDate || undefined,
      tags,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssignee('unassigned');
    setDueDate('');
    setTags([]);
    setTagInput('');

    toast({
      title: "Task Created",
      description: "Your new task has been created successfully",
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              id="description"
              value={description}
              onChange={setDescription}
              placeholder="Describe your task..."
              minHeight="80px"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
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

            {user?.role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign To</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((member) => {
                      const userId = getUserId(member);
                      return (
                        <SelectItem key={userId} value={userId}>
                          <div className="flex items-center gap-2">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-5 h-5 rounded-full"
                            />
                            <span>{member.name}</span>
                            {member.department && (
                              <span className="text-muted-foreground">({member.department})</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tags..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-primary/10 text-primary"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="transition-all duration-300 bg-gradient-primary hover:shadow-glow"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};