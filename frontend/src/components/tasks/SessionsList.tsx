import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Task, WorkSession } from '@/types/task';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Calendar, User as UserIcon, Timer, ChevronDown, Play, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SessionDetailsModal } from './SessionDetailsModal';
import { TaskSessionsModal } from './TaskSessionsModal';

interface SessionsListProps {
  tasks: Task[];
  users: User[];
  selectedUserId?: string;
  onUserFilterChange?: (userId: string) => void;
}

export const SessionsList = ({ tasks, users, selectedUserId, onUserFilterChange }: SessionsListProps) => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);
  const [selectedTaskForSession, setSelectedTaskForSession] = useState<Task | null>(null);
  const [selectedTaskForList, setSelectedTaskForList] = useState<Task | null>(null);

  const handleSessionClick = (session: WorkSession, task: Task) => {
    setSelectedSession(session);
    setSelectedTaskForSession(task);
    setSelectedTaskForList(null); // Close the other modal if open
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskForList(task);
    setSelectedSession(null); // Close the other modal if open
  };

  const closeModal = () => {
    setSelectedSession(null);
    setSelectedTaskForSession(null);
    setSelectedTaskForList(null);
  };
  
  // Filter tasks based on user selection and role
  const filteredTasks = useMemo(() => {
    let taskList = tasks;
    
    // Filter by selected user for admin
    if (user?.role === 'admin' && selectedUserId && selectedUserId !== 'all') {
      taskList = taskList.filter(task => {
        if (typeof task.assignee === 'string') {
          return task.assignee === selectedUserId;
        } else {
          return task.assignee?._id === selectedUserId || task.assignee?.id === selectedUserId;
        }
      });
    }
    
    // For team members, only show their own tasks
    if (user?.role === 'team-member') {
      taskList = taskList.filter(task => {
        if (typeof task.assignee === 'string') {
          return task.assignee === user.id;
        } else {
          return task.assignee?._id === user.id || task.assignee?.id === user.id;
        }
      });
    }
    
    // Only show tasks that have work sessions
    return taskList.filter(task => task.workSessions.length > 0);
  }, [tasks, selectedUserId, user]);

  const totalTimeAllTasks = useMemo(() => {
    return filteredTasks.reduce((total, task) => 
      total + task.workSessions.reduce((taskTotal, session) => taskTotal + session.duration, 0), 0
    );
  }, [filteredTasks]);

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

  const totalSessionTime = useMemo(() => {
    return filteredTasks.reduce((total, task) => 
      total + task.workSessions.reduce((taskTotal, session) => taskTotal + session.duration, 0), 0
    );
  }, [filteredTasks]);

  const activeUsers = useMemo(() => {
    if (user?.role !== 'admin') return [];
    return users.filter(u => tasks.some(task => {
      let assigneeId = '';
      if (typeof task.assignee === 'string') {
        assigneeId = task.assignee;
      } else {
        assigneeId = task.assignee?._id || task.assignee?.id || '';
      }
      return assigneeId === u.id && task.workSessions.length > 0;
    }));
  }, [user?.role, tasks, users]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Work Sessions
            <Badge variant="secondary" className="text-xs">
              {filteredTasks.length} tasks
            </Badge>
          </CardTitle>
          
          {user?.role === 'admin' && onUserFilterChange && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedUserId || 'all'} onValueChange={onUserFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                        All
                      </div>
                      <span>All Team Members</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {activeUsers.length}
                      </Badge>
                    </div>
                  </SelectItem>
                  {activeUsers.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No users with sessions found
                    </div>
                  ) : (
                    activeUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{u.name}</span>
                            {u.department && (
                              <span className="text-xs text-muted-foreground">{u.department}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {filteredTasks.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Total: {formatTime(totalSessionTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              <span>{filteredTasks.reduce((sum, task) => sum + task.workSessions.length, 0)} sessions</span>
            </div>
            {user?.role === 'admin' && selectedUserId && selectedUserId !== 'all' && (
              <div className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                <span>{users.find(u => u.id === selectedUserId)?.name}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No work sessions recorded yet</p>
            <p className="mt-1 text-xs">Start working on tasks to see sessions here</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-96">
            {filteredTasks.map((task) => {
              // Handle both string and object assignee types
              let assignedUser = null;
              if (typeof task.assignee === 'string') {
                assignedUser = users.find(u => u.id === task.assignee);
              } else if (task.assignee && typeof task.assignee === 'object') {
                const assigneeObj = task.assignee as any;
                assignedUser = users.find(u => u.id === (assigneeObj._id || assigneeObj.id));
              }
              
              const taskTotalTime = task.workSessions.reduce((sum, session) => sum + session.duration, 0);
              
              return (
                <div key={task._id} className="p-4 transition-colors border rounded-lg hover:bg-muted/50">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{task.title}</h4>
                      </div>
                      {user?.role === 'admin' && assignedUser && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UserIcon className="w-3 h-3" />
                          <span>{assignedUser.name}</span>
                          <span>•</span>
                          <span>{assignedUser.department}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {task.workSessions.length} session{task.workSessions.length !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {formatTime(taskTotalTime)}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <SessionDetailsModal
        isOpen={!!selectedSession}
        onClose={closeModal}
        session={selectedSession}
        task={selectedTaskForSession}
        users={users}
      />
      <TaskSessionsModal
        isOpen={!!selectedTaskForList}
        onClose={closeModal}
        task={selectedTaskForList}
        users={users}
        onSessionClick={handleSessionClick}
      />
    </Card>
  );
};