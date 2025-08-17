import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Task } from "@/types/task";
import { User } from "@/types/auth";
import {
  Clock,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailsModalProps {
  task: Task;
  assignedUser: User | null;
  isOverdue: boolean;
  isDueToday: boolean;
  completedAfterDue?: boolean;
  formatTime: (minutes: number) => string;
  calculateTimeSpent: () => number;
  children: React.ReactNode; // Trigger element
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

export const TaskDetailsModal = ({
  task,
  assignedUser,
  isOverdue,
  isDueToday,
  completedAfterDue = false,
  formatTime,
  calculateTimeSpent,
  children,
}: TaskDetailsModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", priorityConfig[task.priority].color)}
              >
                {task.priority}
              </Badge>
              <Badge className={statusConfig[task.status].color}>
                {statusConfig[task.status].label}
              </Badge>
              {completedAfterDue && (
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                  Late Completion
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
        <div>
            <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
            <div 
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: task.description }} 
            />
          </div>

          {assignedUser && (
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="w-4 h-4" />
              <span><strong>Assigned to:</strong> {assignedUser.name}</span>
              {assignedUser.department && (
                <>
                  <span>•</span>
                  <span>{assignedUser.department}</span>
                </>
              )}
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              <span><strong>Due Date:</strong> {new Date(task.dueDate).toLocaleDateString()}</span>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs ml-2">
                  Overdue
                </Badge>
              )}
              {isDueToday && (
                <Badge variant="outline" className="text-xs border-warning text-warning bg-warning/10 ml-2">
                  Due Today
                </Badge>
              )}
              {completedAfterDue && (
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 ml-2">
                  Completed Late
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span><strong>Time Spent:</strong> {formatTime(calculateTimeSpent())}</span>
          </div>

          {task.tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Tags:</span>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <p><strong>Created:</strong> {new Date(task.createdAt).toLocaleString()}</p>
              {task.updatedAt && (
                <p><strong>Last Updated:</strong> {new Date(task.updatedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
