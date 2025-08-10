import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { Task, TaskStatus } from '@/types/task';
import { CheckCircle, Clock, Play } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  selectedUserId?: string;
}

const statusConfig = {
  todo: {
    title: 'To Do',
    icon: Play,
    className: 'border-muted',
  },
  'in-progress': {
    title: 'In Progress',
    icon: Clock,
    className: 'border-primary',
  },
  completed: {
    title: 'Completed',
    icon: CheckCircle,
    className: 'border-success',
  },
};

export const KanbanBoard = ({ tasks, onUpdateTask, onDeleteTask, selectedUserId }: KanbanBoardProps) => {
  const tasksByStatus = useMemo(() => {
    const grouped = {
      todo: [] as Task[],
      'in-progress': [] as Task[],
      completed: [] as Task[],
    };

    tasks.forEach(task => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Object.entries(statusConfig).map(([status, config]) => {
        const Icon = config.icon;
        const statusTasks = tasksByStatus[status as TaskStatus];
        
        return (
          <Card key={status} className={`${config.className} border-2`}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span>{config.title}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {statusTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {statusTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks in {config.title.toLowerCase()}</p>
                </div>
              ) : (
                statusTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    showAssignee={true}
                  />
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};