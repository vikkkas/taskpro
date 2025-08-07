import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SessionsList } from './SessionsList';
import { Task } from '@/types/task';

interface SessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  selectedUserId?: string;
  onUserFilterChange?: (userId: string) => void;
}

export const SessionsModal = ({ 
  open, 
  onOpenChange, 
  tasks, 
  selectedUserId, 
  onUserFilterChange 
}: SessionsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Work Sessions</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <SessionsList 
            tasks={tasks}
            selectedUserId={selectedUserId}
            onUserFilterChange={onUserFilterChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};