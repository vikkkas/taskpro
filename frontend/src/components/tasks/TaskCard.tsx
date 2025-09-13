import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { User } from "@/types/auth";
import { TaskComments } from "./TaskComments";
import { EditTaskModal } from "./EditTaskModal";
import { TaskDetailsModal } from "./TaskDetailsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Pause,
  Clock,
  Calendar,
  User as UserIcon,
  AlertCircle,
  MessageSquare,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
// import { users as defaultUsers } from '@/data/staticData';

interface TaskCardProps {
  task: Task;
  users?: User[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (taskId: string) => void;
  showAssignee?: boolean;
  isLoading?: {
    timer?: boolean;
    status?: boolean;
    delete?: boolean;
    update?: boolean;
  };
}

const priorityConfig = {
  low: { color: "bg-muted text-muted-foreground", icon: "○" },
  medium: { color: "bg-warning text-warning-foreground", icon: "◐" },
  high: { color: "bg-destructive text-destructive-foreground", icon: "●" },
};

const statusConfig = {
  todo: { color: "bg-muted text-muted-foreground", label: "To Do" },
  "in-progress": {
    color: "bg-primary text-primary-foreground",
    label: "In Progress",
  },
  completed: {
    color: "bg-success text-success-foreground",
    label: "Completed",
  },
};

export const TaskCard = ({
  task,
  users,
  onUpdateTask,
  onDeleteTask,
  onStartTimer,
  onStopTimer,
  showAssignee = false,
  isLoading = {},
}: TaskCardProps) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showComments, setShowComments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const calculateTimeSpent = () => {
    let totalSeconds = task.timeSpent * 60; // convert minutes to seconds

    if (task.isTimerRunning && task.timerStartedAt) {
      const additionalSeconds = Math.floor(
        (currentTime - new Date(task.timerStartedAt).getTime()) / 1000
      );
      totalSeconds += additionalSeconds;
    }

    return Math.floor(totalSeconds / 60); // return total minutes
  };

  const formatTime = (minutes: number) => {
    if (task.isTimerRunning && task.timerStartedAt) {
      let totalSeconds = task.timeSpent * 60;
      const additionalSeconds = Math.floor(
        (currentTime - new Date(task.timerStartedAt).getTime()) / 1000
      );
      totalSeconds += additionalSeconds;

      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      return `${hours}h ${mins}m`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleTimerToggle = () => {
    if (task.isTimerRunning) {
      onStopTimer(task._id);
    } else {
      onStartTimer(task._id);
    }
  };

  // Check if current user can control timer
  const canControlTimer = () => {
    if (user?.role === 'admin') return true;
    
    // Team members can only control timer for tasks assigned to them
    const isAssignedUser = assignedUsers.some(assignee => {
      const assigneeId = typeof assignee === 'string' ? assignee : (assignee._id || assignee.id);
      const userId = user?._id || user?.id;
      return assigneeId === userId;
    });
    
    return isAssignedUser;
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    // Team members can only update status for tasks assigned to them
    if (user?.role === 'team-member' && !canControlTimer()) {
      return; // Silently ignore if not authorized
    }
    
    onUpdateTask(task._id, {
      status: newStatus,
      isTimerRunning: newStatus === "completed" ? false : task.isTimerRunning,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = () => {
    if (onDeleteTask) {
      onDeleteTask(task._id);
      toast({
        title: "Task Deleted",
        description: "Task has been successfully deleted",
      });
    }
  };

  const assignedUser = (() => {
    if (task.assignee && typeof task.assignee === "object" && 'role' in task.assignee) {
      return task.assignee as User;
    }

    if (typeof task.assignee === "string") {
      return users?.find((u) => {
        const userId = u._id || u.id;
        return userId === task.assignee;
      }) || null;
    }

    return null;
  })();

  // Get multiple assignees
  const assignedUsers = (() => {
    if (task.assignees && task.assignees.length > 0) {
      return task.assignees.map(assignee => {
        // If it's already a populated object
        if (typeof assignee === "object" && assignee !== null) {
          return assignee;
        }
        // If it's a string ID, find the user
        if (typeof assignee === "string") {
          return users?.find((u) => {
            const userId = u._id || u.id;
            return userId === assignee;
          }) || null;
        }
        return null;
      }).filter(Boolean) as Array<{ _id: string; id?: string; name: string; email: string; department: string; avatar?: string; }>;
    }
    // Fallback to single assignee for backward compatibility
    return assignedUser ? [assignedUser] : [];
  })();

  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  if (dueDate) {
    dueDate.setHours(0, 0, 0, 0); 
  }

  const isOverdue = dueDate && today > dueDate && task.status !== "completed";
  const isDueToday = dueDate && today.getTime() === dueDate.getTime() && task.status !== "completed";
  const isAnyLoading = Object.values(isLoading).some(Boolean);

  const isDescriptionLong = task.description.length > 30;

  const getTrimmedDescription = (htmlContent: string, maxLength: number = 100) => {
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    
    if (textContent.length <= maxLength) {
      return htmlContent;
    }
    
    const truncatedText = textContent.substring(0, maxLength).trim();
    
    if (htmlContent !== textContent) {
      return truncatedText + '...';
    }
    return truncatedText + '...';
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-elegant",
        task.isTimerRunning && "ring-2 ring-primary shadow-glow animate-pulse-glow"
      )}
    >
      {/* Timer Running Indicator */}
      {task.isTimerRunning && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium animate-pulse">
          <div className="w-2 h-2 bg-current rounded-full animate-ping"></div>
          LIVE
        </div>
      )}

      <CardHeader className="pb-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {task.title}
              </h3>
              {(isOverdue || isDueToday) && (
                <AlertCircle 
                  className={cn(
                    "w-4 h-4 flex-shrink-0 mt-0.5",
                    isOverdue ? 'text-destructive' : 'text-warning'
                  )} 
                />
              )}
            </div>
            
            {/* Description */}
            {task.description && (
              <div className="space-y-1">
                <div 
                  className="text-sm text-muted-foreground leading-relaxed rich-text-content"
                  dangerouslySetInnerHTML={{ __html: getTrimmedDescription(task.description, 100) }}
                />
                <TaskDetailsModal
                  task={task}
                  assignedUser={assignedUser}
                  isOverdue={isOverdue}
                  isDueToday={isDueToday}
                  formatTime={formatTime}
                  calculateTimeSpent={calculateTimeSpent}
                >
                  <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                    View Details
                  </button>
                </TaskDetailsModal>
              </div>
            )}
          </div>

          {/* Admin Actions */}
          {user?.role === "admin" && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEditModal(true)}
                className="w-8 h-8 p-0"
                disabled={isAnyLoading}
              >
                {isLoading.update ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                ) : (
                  <Edit className="w-3 h-3" />
                )}
              </Button>

              {onDeleteTask && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                      disabled={isAnyLoading}
                    >
                      {isLoading.delete ? (
                        <Loader2 className="w-3 h-3 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{task.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTask}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isLoading.delete}
                      >
                        {isLoading.delete ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={statusConfig[task.status].color}>
            {statusConfig[task.status].label}
          </Badge>
          
          <Badge
            variant="secondary"
            className={cn("text-xs", priorityConfig[task.priority].color)}
          >
            {task.priority}
          </Badge>

          {assignedUsers.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {assignedUsers.length === 1 
                ? assignedUsers[0].name
                : `${assignedUsers.length} members`}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatTime(calculateTimeSpent())}</span>
          </div>
          
          {/* Show who is running the timer */}
          {task.isTimerRunning && task.timerStartedBy && typeof task.timerStartedBy === 'object' && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <UserIcon className="w-3 h-3" />
              <span>{task.timerStartedBy.name} is working</span>
            </div>
          )}
        </div>

        {showAssignee && assignedUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserIcon className="w-3 h-3" />
            <div className="flex items-center gap-1">
              {assignedUsers.slice(0, 2).map((user, index) => (
                <span key={user._id || user.id} className="flex items-center gap-1">
                  {index > 0 && <span>•</span>}
                  <span>{user.name}</span>
                  {user.department && (
                    <span className="text-muted-foreground">({user.department})</span>
                  )}
                </span>
              ))}
              {assignedUsers.length > 2 && (
                <span className="text-muted-foreground">
                  • +{assignedUsers.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
            {isDueToday && (
              <Badge variant="outline" className="text-xs border-warning text-warning bg-warning/10">
                Hurry Up!
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={task.isTimerRunning ? "destructive" : "default"}
            onClick={handleTimerToggle}
            className="flex items-center gap-1"
            disabled={task.status === "completed" || isLoading.timer || !canControlTimer()}
          >
            {isLoading.timer ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Loading...</span>
              </>
            ) : task.isTimerRunning ? (
              <>
                <Pause className="w-3 h-3" />
                <span className="text-xs">Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span className="text-xs">Start</span>
              </>
            )}
          </Button>

          <Dialog open={showComments} onOpenChange={setShowComments}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                disabled={isAnyLoading}
              >
                <MessageSquare className="w-3 h-3" />
                <span className="text-xs">{task.comments?.length || 0}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{task.title} - Comments & Remarks</DialogTitle>
              </DialogHeader>
              <TaskComments
                task={task}
                users={users || []}
                onUpdateTask={onUpdateTask}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-1">
          {(["todo", "in-progress", "completed"] as TaskStatus[]).map(
            (status) => (
              <Button
                key={status}
                size="sm"
                variant={task.status === status ? "default" : "outline"}
                onClick={() => handleStatusChange(status)}
                className="text-xs"
                disabled={isLoading.status || isAnyLoading || (user?.role === 'team-member' && !canControlTimer())}
              >
                {isLoading.status ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    {statusConfig[status].label}
                  </>
                ) : (
                  statusConfig[status].label
                )}
              </Button>
            )
          )}
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-content b,
          .rich-text-content strong {
            font-weight: bold !important;
          }
          .rich-text-content i,
          .rich-text-content em {
            font-style: italic !important;
          }
          .rich-text-content u {
            text-decoration: underline !important;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />

      <EditTaskModal
        task={task}
        users={users || []}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdateTask={onUpdateTask}
        isLoading={isLoading.update}
      />
    </Card>
  );
};
