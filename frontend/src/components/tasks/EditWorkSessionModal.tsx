import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, WorkSession } from '@/types/task';
import { User } from '@/types/auth';
import { Calendar, Clock, User as UserIcon, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { putAPI } from '@/utils/BasicApi';
import { TASK } from '@/utils/apiURL';

interface EditWorkSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkSession | null;
  task: Task | null;
  users: User[];
  onSessionUpdated: (updatedTask: Task) => void;
}

export const EditWorkSessionModal = ({ 
  isOpen, 
  onClose, 
  session, 
  task, 
  users, 
  onSessionUpdated 
}: EditWorkSessionModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    duration: 0,
    userId: '',
    startedBy: '',
    stoppedBy: ''
  });

  // Initialize form data when session changes
  useEffect(() => {
    if (session && task) {
      setFormData({
        startTime: session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '',
        endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
        duration: session.duration || 0,
        userId: typeof session.userId === 'string' ? session.userId : (session.userId?._id || session.userId?.id || ''),
        startedBy: typeof session.startedBy === 'string' ? session.startedBy : (session.startedBy?._id || session.startedBy?.id || ''),
        stoppedBy: typeof session.stoppedBy === 'string' ? (session.stoppedBy || 'none') : (session.stoppedBy?._id || session.stoppedBy?.id || 'none')
      });
    }
  }, [session, task]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate duration when both start and end times are provided
    if ((field === 'startTime' || field === 'endTime') && formData.startTime && formData.endTime) {
      const start = field === 'startTime' ? new Date(value) : new Date(formData.startTime);
      const end = field === 'endTime' ? new Date(value) : new Date(formData.endTime);
      
      if (start < end) {
        const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Duration in minutes
        setFormData(prev => ({
          ...prev,
          duration: Math.max(0, duration)
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !task) return;

    // Validation
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast({
        title: "Validation Error",
        description: "Start time must be before end time",
        variant: "destructive",
      });
      return;
    }

    if (formData.startTime && new Date(formData.startTime) > new Date()) {
      toast({
        title: "Validation Error",
        description: "Start time cannot be in the future",
        variant: "destructive",
      });
      return;
    }

    if (formData.endTime && new Date(formData.endTime) > new Date()) {
      toast({
        title: "Validation Error",
        description: "End time cannot be in the future",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Convert "none" back to empty string for the API
      const apiData = {
        ...formData,
        stoppedBy: formData.stoppedBy === "none" ? "" : formData.stoppedBy
      };
      
      const response = await putAPI(TASK.EDIT_SESSION(task._id, session._id), apiData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Work session updated successfully",
        });
        
        onSessionUpdated(response.data);
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to update work session:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update work session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  if (!session || !task) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Edit Work Session
          </DialogTitle>
          <DialogDescription>
            Edit work session for task: "{task.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="w-full"
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Time
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Calculated: {formatDuration(formData.duration)}
              </p>
            </div>

            {/* User ID (Who worked) */}
            <div className="space-y-2">
              <Label htmlFor="userId" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Worked By
              </Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Started By */}
            <div className="space-y-2">
              <Label htmlFor="startedBy" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Started By
              </Label>
              <Select
                value={formData.startedBy}
                onValueChange={(value) => setFormData(prev => ({ ...prev, startedBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stopped By */}
            <div className="space-y-2">
              <Label htmlFor="stoppedBy" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Stopped By
              </Label>
              <Select
                value={formData.stoppedBy}
                onValueChange={(value) => setFormData(prev => ({ ...prev, stoppedBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No one (still running)</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Values Display */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Current Session Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium">{formatDuration(session.duration)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Worked by:</span>
                <span className="ml-2 font-medium">{getUserName(formData.userId)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
