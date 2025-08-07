import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Task, WorkSession } from '@/types/task';
import { users } from '@/data/staticData';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Calendar, User, Timer, ChevronDown, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionsListProps {
  tasks: Task[];
  selectedUserId?: string;
  onUserFilterChange?: (userId: string) => void;
}

export const SessionsList = ({ tasks, selectedUserId, onUserFilterChange }: SessionsListProps) => {
  const { user } = useAuth();
  
  // Filter tasks based on user selection and role
  const filteredTasks = useMemo(() => {
    let taskList = tasks;
    
    // Filter by selected user for admin
    if (user?.role === 'admin' && selectedUserId && selectedUserId !== 'all') {
      taskList = taskList.filter(task => task.assignee === selectedUserId);
    }
    
    // For team members, only show their own tasks
    if (user?.role === 'team-member') {
      taskList = taskList.filter(task => task.assignee === user.id);
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
    return users.filter(u => tasks.some(task => task.assignee === u.id && task.workSessions.length > 0));
  }, [user?.role, tasks]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Work Sessions (Task-wise)
            <Badge variant="secondary" className="text-xs">
              {filteredTasks.length} tasks
            </Badge>
          </CardTitle>
          
          {user?.role === 'admin' && onUserFilterChange && (
            <Select value={selectedUserId || 'all'} onValueChange={onUserFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {activeUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <User className="w-4 h-4" />
                <span>{users.find(u => u.id === selectedUserId)?.name}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No work sessions recorded yet</p>
            <p className="text-xs mt-1">Start working on tasks to see sessions here</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredTasks.map((task) => {
              const assignedUser = users.find(u => u.id === task.assignee);
              const taskTotalTime = task.workSessions.reduce((sum, session) => sum + session.duration, 0);
              
              return (
                <Collapsible key={task.id}>
                  <CollapsibleTrigger asChild>
                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                          {user?.role === 'admin' && assignedUser && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
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
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-2 ml-4 space-y-2">
                      {task.workSessions
                        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                        .map((session) => {
                          const startDateTime = formatDateTime(session.startTime);
                          const endDateTime = session.endTime ? formatDateTime(session.endTime) : null;
                          
                          return (
                            <div
                              key={session.id}
                              className="border rounded-md p-3 bg-muted/30 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Play className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs font-medium">Session {session.id.split('-').pop()}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {formatTime(session.duration)}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Started: {startDateTime.date} at {startDateTime.time}</span>
                                </div>
                                
                                {endDateTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Ended: {endDateTime.date} at {endDateTime.time}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};