import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task, WorkSession } from '@/types/task';
import { User } from '@/types/auth';
import { Calendar, Clock, User as UserIcon, Edit } from 'lucide-react';
import { EditWorkSessionModal } from './EditWorkSessionModal';

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkSession | null;
  task: Task | null;
  users: User[];
  onSessionUpdated?: (updatedTask: Task) => void;
  userRole?: string;
}

export const SessionDetailsModal = ({ 
  isOpen, 
  onClose, 
  session, 
  task, 
  users, 
  onSessionUpdated,
  userRole 
}: SessionDetailsModalProps) => {
  const [showEditModal, setShowEditModal] = useState(false);

  if (!session || !task) {
    return null;
  }

  // Handle both string and object assignee types
  const getAssignedUser = () => {
    if (!users || users.length === 0) return null;
    
    if (typeof task.assignee === 'string') {
      return users.find(u => u.id === task.assignee);
    } else if (task.assignee && typeof task.assignee === 'object') {
      const assigneeObj = task.assignee as any;
      return users.find(u => u.id === (assigneeObj._id || assigneeObj.id));
    }
    return null;
  };

  const assignedUser = getAssignedUser();

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
  };

  const getUserName = (user: string | { _id: string; id?: string; name: string; email: string; department: string; avatar?: string; } | null | undefined) => {
    if (!user) {
      return 'Unknown User';
    }
    
    if (typeof user === 'string') {
      const foundUser = users.find(u => u.id === user);
      return foundUser?.name || 'Unknown User';
    }
    
    if (typeof user === 'object') {
      return user.name || 'Unknown User';
    }
    
    return 'Unknown User';
  };

  const handleSessionUpdated = (updatedTask: Task) => {
    if (onSessionUpdated) {
      onSessionUpdated(updatedTask);
    }
    setShowEditModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Work Session Details</DialogTitle>
                <DialogDescription>
                  Details for a work session on task: "{task.title}"
                </DialogDescription>
              </div>
              {userRole === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">Start Time</p>
              <p className="text-sm text-muted-foreground">{formatDateTime(session.startTime)}</p>
            </div>
          </div>
          {session.endTime && (
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">End Time</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(session.endTime)}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">Duration</p>
              <p className="text-sm text-muted-foreground">{formatDuration(session.duration)}</p>
            </div>
          </div>
          
          {/* Timer Control Information */}
          {session.startedBy && (
            <div className="flex items-center gap-4">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Timer Started By</p>
                <p className="text-sm text-muted-foreground">{getUserName(session.startedBy)}</p>
              </div>
            </div>
          )}
          
          {session.stoppedBy && (
            <div className="flex items-center gap-4">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Timer Stopped By</p>
                <p className="text-sm text-muted-foreground">{getUserName(session.stoppedBy)}</p>
              </div>
            </div>
          )}
          
          {assignedUser && (
            <div className="flex items-center gap-4">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Worked by</p>
                <p className="text-sm text-muted-foreground">{assignedUser.name}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Edit Work Session Modal */}
    <EditWorkSessionModal
      isOpen={showEditModal}
      onClose={() => setShowEditModal(false)}
      session={session}
      task={task}
      users={users}
      onSessionUpdated={handleSessionUpdated}
    />
  </>
  );
};
