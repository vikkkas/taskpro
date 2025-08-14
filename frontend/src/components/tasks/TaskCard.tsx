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

  const handleStatusChange = (newStatus: TaskStatus) => {
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
    // If task.assignee is already a populated user object, use it directly
    if (task.assignee && typeof task.assignee === "object") {
      return task.assignee;
    }

    // If task.assignee is a string (user ID), find the user in the users array
    if (typeof task.assignee === "string") {
      return users.find((u) => {
        const userId = u._id || u.id;
        return userId === task.assignee;
      });
    }

    return null;
  })();

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  if (dueDate) {
    dueDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
  }

  const isOverdue = dueDate && today > dueDate && task.status !== "completed";
  const isDueToday = dueDate && today.getTime() === dueDate.getTime() && task.status !== "completed";

  // Check if any operation is loading
  const isAnyLoading = Object.values(isLoading).some(Boolean);

  // Check if description is long (more than 100 characters)
  const isDescriptionLong = task.description.length > 100;

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-elegant",
        task.isTimerRunning &&
          "ring-2 ring-primary shadow-glow animate-pulse-glow"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold leading-tight">
                {task.title}
              </h3>
              {(isOverdue || isDueToday) && (
                <AlertCircle className={`w-4 h-4 ${isOverdue ? 'text-destructive' : 'text-warning'}`} />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
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
          </div>

          <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1">
              <Badge
                variant="secondary"
                className={cn("text-xs", priorityConfig[task.priority].color)}
              >
                {task.priority}
              </Badge>
            </div>
            {user?.role === "admin" ? (
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
                          Are you sure you want to delete "{task.title}"? This
                          action cannot be undone.
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
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={statusConfig[task.status].color}>
            {statusConfig[task.status].label}
          </Badge>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatTime(calculateTimeSpent())}</span>
          </div>
        </div>

        {showAssignee && assignedUser && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserIcon className="w-3 h-3" />
            <span>{assignedUser.name}</span>
            <span>•</span>
            <span>{assignedUser.department}</span>
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
            disabled={task.status === "completed" || isLoading.timer}
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
                disabled={isLoading.status || isAnyLoading}
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
