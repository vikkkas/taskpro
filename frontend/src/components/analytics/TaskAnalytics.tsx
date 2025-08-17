import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Task } from '@/types/task';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Users
} from 'lucide-react';

interface TaskAnalyticsProps {
  tasks: Task[];
  users: User[];
  selectedUserId?: string;
  onUserFilterChange?: (userId: string) => void;
}

type TimePeriod = 'weekly' | 'monthly' | 'yearly';

export const TaskAnalytics = ({ tasks, users, selectedUserId, onUserFilterChange }: TaskAnalyticsProps) => {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');

  // Filter tasks based on user selection and role
  const filteredTasks = useMemo(() => {
    let taskList = tasks;
    
    if (user?.role === 'admin' && selectedUserId && selectedUserId !== 'all') {
      // Handle both string and object assignee types
      taskList = taskList.filter(task => {
        if (typeof task.assignee === 'string') {
          return task.assignee === selectedUserId;
        } else {
          return task.assignee?._id === selectedUserId || task.assignee?.id === selectedUserId;
        }
      });
    }
    
    if (user?.role === 'team-member') {
      taskList = taskList.filter(task => task.assignee === user.id);
    }
    
    return taskList;
  }, [tasks, selectedUserId, user]);

  // Generate time series data based on selected period
  const timeSeriesData = useMemo(() => {
    const now = new Date();
    const data: { period: string; timeSpent: number; tasksCompleted: number }[] = [];
    
    if (timePeriod === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTasks = filteredTasks.filter(task => 
          task.workSessions.some(session => 
            session.startTime.startsWith(dateStr)
          )
        );
        
        const timeSpent = dayTasks.reduce((total, task) => 
          total + task.workSessions
            .filter(session => session.startTime.startsWith(dateStr))
            .reduce((sum, session) => sum + session.duration, 0), 0
        );
        
        const tasksCompleted = dayTasks.filter(task => 
          task.status === 'completed' && 
          task.updatedAt.startsWith(dateStr)
        ).length;
        
        data.push({
          period: date.toLocaleDateString([], { weekday: 'short' }),
          timeSpent: Math.round(timeSpent / 60 * 10) / 10, // Convert to hours with 1 decimal
          tasksCompleted
        });
      }
    } else if (timePeriod === 'monthly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const monthTasks = filteredTasks.filter(task => 
          task.workSessions.some(session => 
            session.startTime.startsWith(monthStr)
          )
        );
        
        const timeSpent = monthTasks.reduce((total, task) => 
          total + task.workSessions
            .filter(session => session.startTime.startsWith(monthStr))
            .reduce((sum, session) => sum + session.duration, 0), 0
        );
        
        const tasksCompleted = monthTasks.filter(task => 
          task.status === 'completed' && 
          task.updatedAt.startsWith(monthStr)
        ).length;
        
        data.push({
          period: date.toLocaleDateString([], { month: 'short' }),
          timeSpent: Math.round(timeSpent / 60 * 10) / 10,
          tasksCompleted
        });
      }
    } else {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const yearStr = year.toString();
        
        const yearTasks = filteredTasks.filter(task => 
          task.workSessions.some(session => 
            session.startTime.startsWith(yearStr)
          )
        );
        
        const timeSpent = yearTasks.reduce((total, task) => 
          total + task.workSessions
            .filter(session => session.startTime.startsWith(yearStr))
            .reduce((sum, session) => sum + session.duration, 0), 0
        );
        
        const tasksCompleted = yearTasks.filter(task => 
          task.status === 'completed' && 
          task.updatedAt.startsWith(yearStr)
        ).length;
        
        data.push({
          period: yearStr,
          timeSpent: Math.round(timeSpent / 60 * 10) / 10,
          tasksCompleted
        });
      }
    }
    
    return data;
  }, [filteredTasks, timePeriod]);

  // Task status distribution
  const statusData = useMemo(() => {
    const statusCounts = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'To Do', value: statusCounts.todo || 0, color: '#8b5cf6' },
      { name: 'In Progress', value: statusCounts['in-progress'] || 0, color: '#f59e0b' },
      { name: 'Completed', value: statusCounts.completed || 0, color: '#10b981' }
    ];
  }, [filteredTasks]);

  // Priority distribution
  const priorityData = useMemo(() => {
    const priorityCounts = filteredTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Low', value: priorityCounts.low || 0, color: '#10b981' },
      { name: 'Medium', value: priorityCounts.medium || 0, color: '#f59e0b' },
      { name: 'High', value: priorityCounts.high || 0, color: '#ef4444' }
    ];
  }, [filteredTasks]);

  // Overall stats
  const overallStats = useMemo(() => {
    const totalTime = filteredTasks.reduce((total, task) => 
      total + task.workSessions.reduce((sum, session) => sum + session.duration, 0), 0
    );
    
    const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
    const avgTimePerTask = filteredTasks.length > 0 ? totalTime / filteredTasks.length : 0;
    const activeThisPeriod = timeSeriesData.reduce((sum, data) => sum + data.timeSpent, 0);

    return {
      totalTime: Math.round(totalTime / 60 * 10) / 10, // Convert to hours
      completedTasks,
      avgTimePerTask: Math.round(avgTimePerTask / 60 * 10) / 10,
      activeThisPeriod: Math.round(activeThisPeriod * 10) / 10
    };
  }, [filteredTasks, timeSeriesData]);

  const activeUsers = useMemo(() => {
    if (user?.role !== 'admin') return [];
    return users.filter(u => tasks.some(task => {
      if (typeof task.assignee === 'string') {
        return task.assignee === u.id;
      } else {
        return task.assignee?._id === u.id || task.assignee?.id === u.id;
      }
    }));
  }, [user?.role, tasks, users]);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Analytics</h2>
          <p className="text-muted-foreground">
            Performance insights and trends
          </p>
        </div>
        
        <div className="flex gap-2">
          {user?.role === 'admin' && onUserFilterChange && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedUserId || 'all'} onValueChange={onUserFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Team Member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        All
                      </div>
                      <span>All Members</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {activeUsers.length}
                      </Badge>
                    </div>
                  </SelectItem>
                  {activeUsers.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No active members found
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
          
          <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Member-specific summary for admin when a specific user is selected */}
      {user?.role === 'admin' && selectedUserId && selectedUserId !== 'all' && (
  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800 dark:border-gray-700 dark:text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              {(() => {
                const selectedUser = activeUsers.find(u => u.id === selectedUserId);
                if (!selectedUser) return null;
                return (
                  <>
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-black dark:text-white">{selectedUser.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.department} • {selectedUser.role}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredTasks.length}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredTasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredTasks.filter(t => t.status === 'in-progress').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(filteredTasks.reduce((total, task) => 
                    total + task.workSessions.reduce((sum, session) => sum + session.duration, 0), 0
                  ) / 60 * 10) / 10}h
                </div>
                <div className="text-sm text-muted-foreground">Time Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{overallStats.totalTime}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{overallStats.completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Time/Task</p>
                <p className="text-2xl font-bold">{overallStats.avgTimePerTask}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">This {timePeriod.slice(0, -2)}</p>
                <p className="text-2xl font-bold">{overallStats.activeThisPeriod}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Tracking Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Time Tracking ({timePeriod})
                </CardTitle>
              </CardHeader>
              <CardContent> 
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value}h`, name === 'timeSpent' ? 'Hours' : 'Tasks']}
                      contentStyle={{ color: '#000', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}
                      itemStyle={{ color: '#000' }}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar dataKey="timeSpent" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Task Completion Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Task Completion ({timePeriod})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value}`, 'Tasks Completed']}
                      contentStyle={{ color: '#000', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}
                      itemStyle={{ color: '#000' }}
                      labelStyle={{ color: '#000' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasksCompleted" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Task Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ color: '#000', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}
                      itemStyle={{ color: '#000' }}
                      labelStyle={{ color: '#000' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {statusData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ color: '#000', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}
                      itemStyle={{ color: '#000' }}
                      labelStyle={{ color: '#000' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {priorityData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};