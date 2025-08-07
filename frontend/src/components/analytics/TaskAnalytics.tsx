import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Task } from '@/types/task';
import { users } from '@/data/staticData';
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
  Activity
} from 'lucide-react';

interface TaskAnalyticsProps {
  tasks: Task[];
  selectedUserId?: string;
  onUserFilterChange?: (userId: string) => void;
}

type TimePeriod = 'weekly' | 'monthly' | 'yearly';

export const TaskAnalytics = ({ tasks, selectedUserId, onUserFilterChange }: TaskAnalyticsProps) => {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');

  // Filter tasks based on user selection and role
  const filteredTasks = useMemo(() => {
    let taskList = tasks;
    
    if (user?.role === 'admin' && selectedUserId && selectedUserId !== 'all') {
      taskList = taskList.filter(task => task.assignee === selectedUserId);
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
    return users.filter(u => tasks.some(task => task.assignee === u.id));
  }, [user?.role, tasks]);

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
            <Select value={selectedUserId || 'all'} onValueChange={onUserFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Team Member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {activeUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <Tooltip formatter={(value) => [`${value}`, 'Tasks Completed']} />
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
                    <Tooltip />
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
                    <Tooltip />
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