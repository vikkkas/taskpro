import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskComments } from './TaskComments';
import { Play, Pause, Clock, Calendar, User, AlertCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { users } from '@/data/staticData';

interface TaskCardProps {
  task: Task;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  showAssignee?: boolean;
}

const priorityConfig = {
  low: { color: 'bg-muted text-muted-foreground', icon: '○' },
  medium: { color: 'bg-warning text-warning-foreground', icon: '◐' },
  high: { color: 'bg-destructive text-destructive-foreground', icon: '●' },
};

const statusConfig = {
  todo: { color: 'bg-muted text-muted-foreground', label: 'To Do' },
  'in-progress': { color: 'bg-primary text-primary-foreground', label: 'In Progress' },
  completed: { color: 'bg-success text-success-foreground', label: 'Completed' },
};

export const TaskCard = ({ task, onUpdateTask, showAssignee = false }: TaskCardProps) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showComments, setShowComments] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const calculateTimeSpent = () => {
    let totalTime = task.timeSpent;
    
    if (task.isTimerRunning && task.timerStartedAt) {
      const additionalTime = Math.floor((currentTime - new Date(task.timerStartedAt).getTime()) / 1000 / 60);
      totalTime += additionalTime;
    }
    
    return totalTime;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleTimerToggle = () => {
    if (task.isTimerRunning) {
      // Stop timer and create work session
      const sessionStartTime = new Date(task.timerStartedAt!);
      const sessionEndTime = new Date(currentTime);
      const sessionDuration = Math.floor((sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000 / 60);
      
      const newWorkSession = {
        id: `${task.id}-${Date.now()}`,
        startTime: task.timerStartedAt!,
        endTime: sessionEndTime.toISOString(),
        duration: sessionDuration,
      };

        onUpdateTask(task.id, {
          isTimerRunning: false,
          timeSpent: task.timeSpent + sessionDuration,
          timerStartedAt: undefined,
          status: 'in-progress' as TaskStatus,
          workSessions: [...task.workSessions, newWorkSession],
          comments: task.comments || []
        });
    } else {
      // Start timer
      onUpdateTask(task.id, {
        isTimerRunning: true,
        timerStartedAt: new Date().toISOString(),
        status: 'in-progress' as TaskStatus,
      });
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdateTask(task.id, {
      status: newStatus,
      isTimerRunning: newStatus === 'completed' ? false : task.isTimerRunning,
      updatedAt: new Date().toISOString(),
    });
  };

  const assignedUser = users.find(u => u.id === task.assignee);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-elegant",
      task.isTimerRunning && "ring-2 ring-primary shadow-glow animate-pulse-glow"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm leading-tight">{task.title}</h3>
              {isOverdue && (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs">{priorityConfig[task.priority].icon}</span>
            <Badge 
              variant="secondary" 
              className={cn("text-xs", priorityConfig[task.priority].color)}
            >
              {task.priority}
            </Badge>
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
            <User className="w-3 h-3" />
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
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={task.isTimerRunning ? "destructive" : "default"}
            onClick={handleTimerToggle}
            className="flex items-center gap-1"
            disabled={task.status === 'completed'}
          >
            {task.isTimerRunning ? (
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
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span className="text-xs">{task.comments?.length || 0}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{task.title} - Comments & Remarks</DialogTitle>
              </DialogHeader>
              <TaskComments task={task} onUpdateTask={onUpdateTask} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-1 flex-wrap">
          {(['todo', 'in-progress', 'completed'] as TaskStatus[]).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={task.status === status ? "default" : "outline"}
              onClick={() => handleStatusChange(status)}
              className="text-xs"
            >
              {statusConfig[status].label}
            </Button>
          ))}
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
    </Card>
  );
};