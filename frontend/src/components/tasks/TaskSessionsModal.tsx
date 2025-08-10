import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Task, WorkSession } from '@/types/task';
import { User } from '@/types/auth';
import { Calendar, Clock, User as UserIcon, Timer } from 'lucide-react';

interface TaskSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
  onSessionClick: (session: WorkSession, task: Task) => void;
}

export const TaskSessionsModal = ({ isOpen, onClose, task, users, onSessionClick }: TaskSessionsModalProps) => {
  if (!task) {
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
  const taskTotalTime = task.workSessions.reduce((sum, session) => sum + session.duration, 0);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            All work sessions recorded for this task.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <h4 className="font-medium">Task Summary</h4>
              {assignedUser && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <UserIcon className="w-4 h-4" />
                  <span>{assignedUser.name}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-bold">
                <Clock className="w-5 h-5" />
                <span>{formatTime(taskTotalTime)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {task.workSessions.length} session{task.workSessions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            <h4 className="font-medium text-sm text-muted-foreground">Sessions</h4>
            {task.workSessions
              .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
              .map((session) => {
                const startDateTime = formatDateTime(session.startTime);
                
                return (
                  <div
                    key={session._id}
                    className="border rounded-md p-3 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => onSessionClick(session, task)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="font-medium">{formatTime(session.duration)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            on {startDateTime.date}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Click to view details
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
