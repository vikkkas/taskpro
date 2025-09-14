import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskCardSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { SessionsList } from '@/components/tasks/SessionsList';
import { SessionsModal } from '@/components/tasks/SessionsModal';
import { TaskAnalytics } from '@/components/analytics/TaskAnalytics';
import { UserManagement } from '@/components/admin/UserManagement';
import { ActiveTimers } from '@/components/admin/ActiveTimers';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskPagination } from '@/components/ui/task-pagination';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { User } from '@/types/auth';
import { getAPI, postAPI, putAPI, deleteAPI, postAPIWithoutBody } from '@/utils/BasicApi';
import { TASK, USERS } from '@/utils/apiURL';
import { useToast } from '@/hooks/use-toast';

import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users,
  BarChart3,
  Timer,
  Target,
  LayoutGrid,
  List
} from 'lucide-react';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskLoadingStates, setTaskLoadingStates] = useState<Record<string, {
    timer?: boolean;
    status?: boolean;
    delete?: boolean;
    update?: boolean;
  }>>({});
  const [globalStats, setGlobalStats] = useState<any>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Helper function to get user ID (handles both _id and id)
  const getUserId = (user: User): string => user._id || user.id || '';
  const getCurrentUserId = (): string => {
    if (!user) return '';
    return user._id || user.id || '';
  };

  // Since tasks are now filtered on the backend, we use them directly
  const userTasks = useMemo(() => {
    if (!user) {
      return [];
    }
    // Backend handles role-based filtering, so we can use tasks directly
      return tasks;
  }, [tasks, user]);

  // For display purposes, use the backend-filtered tasks directly
  const displayTasks = useMemo(() => {
    return tasks; // Backend handles all filtering including role-based access
  }, [tasks]);

  // Apply filters to active tasks (non-completed)
  const filteredActiveTasks = useMemo(() => {
    // Always filter out completed tasks for active tasks display
    return displayTasks.filter(task => task.status !== 'completed');
  }, [displayTasks]);

  // Apply filters to completed tasks
  const filteredCompletedTasks = useMemo(() => {
    // Always filter to only completed tasks for completed tasks display
    return displayTasks.filter(task => task.status === 'completed');
  }, [displayTasks]);

  // Keep original filteredTasks for backward compatibility
  const filteredTasks = useMemo(() => {
    return displayTasks;
  }, [displayTasks]);

  // Calculate statistics from global stats API
  const stats = useMemo(() => {
    console.log('Calculating stats - user role:', user?.role, 'globalStats:', globalStats);
    console.log('Current tasks count:', tasks.length);
    console.log('Tasks with completed status:', tasks.filter(t => t.status === 'completed').length);
    if (user?.role === 'admin') {
      // For admin, use globalStats if available, otherwise calculate from local data
      if (globalStats) {
        console.log('Using globalStats for admin:', globalStats);
        return globalStats;
      }
      
      // Calculate stats from local task data for admin
      const activeTasks = tasks.filter(t => t.status !== 'completed').length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      
      console.log('Fallback calculation - All tasks:', tasks.length);
      console.log('Fallback calculation - Task statuses:', tasks.map(t => ({ id: t._id, title: t.title, status: t.status })));
      console.log('Fallback calculation - Active tasks (should exclude completed):', activeTasks);
      console.log('Fallback calculation - Completed tasks:', completedTasks);
      console.log('Fallback calculation - Tasks with status !== completed:', tasks.filter(t => t.status !== 'completed').map(t => ({ id: t._id, title: t.title, status: t.status })));
      const activeTimers = tasks.filter(t => t.activeTimers && t.activeTimers.length > 0).length;
      const uniqueUsers = new Set(tasks.flatMap(t => 
        [...(t.assignees || []), t.assignee].filter(Boolean)
      )).size;
      
      // Calculate today's hours worked by team members
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysHours = tasks.reduce((total, task) => {
        if (!task.workSessions || !Array.isArray(task.workSessions)) return total;
        
        return total + task.workSessions.reduce((sessionTotal, session) => {
          const sessionDate = new Date(session.startTime);
          sessionDate.setHours(0, 0, 0, 0);
          
          // Check if session is from today
          if (sessionDate.getTime() === today.getTime() && session.duration) {
            return sessionTotal + session.duration;
          }
          return sessionTotal;
        }, 0);
      }, 0);
      
      console.log('Fallback today\'s hours calculation:', {
        today: today.toISOString().split('T')[0],
        todaysHours,
        todaysHoursInHours: Math.round(todaysHours / 60 * 10) / 10
      });
      
      const fallbackStats = {
        totalTasks: activeTasks,
        activeUsers: uniqueUsers,
        activeTasks: activeTimers,
        totalTimeSpent: Math.round(todaysHours / 60 * 10) / 10 // Convert to hours with 1 decimal
      };
      console.log('Using fallback stats calculation for admin:', fallbackStats);
      return fallbackStats;
    } else {
      // For team members, calculate stats from their assigned tasks
      const userTasks = tasks.filter(task => {
        const isAssigned = task.assignees?.some(assignee => {
          const assigneeId = typeof assignee === 'string' ? assignee : (assignee._id || assignee.id);
          return assigneeId === user?.id;
        }) || (task.assignee && (
          typeof task.assignee === 'string' ? task.assignee === user?.id : 
          (task.assignee._id || task.assignee.id) === user?.id
        ));
        return isAssigned;
      });
      
      const activeTasks = userTasks.filter(t => t.status !== 'completed').length;
      const completedTasks = userTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = userTasks.filter(t => t.status === 'in-progress').length;
      const overdueTasks = userTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'completed';
      }).length;
      
      return {
        totalTasks: activeTasks,
      completedTasks,
      inProgressTasks,
        overdueTasks
    };
    }
  }, [globalStats, user?.role, tasks, user?.id]);
  
  useEffect(() => {
    if (user) {  // Only fetch when user is available
      getAllTasks(1, pageSize); // Reset to first page when component mounts
      if (user.role === 'admin') {
        fetchGlobalStats(); // Fetch global stats only for admin
        fetchUsers();
      }
    }
  }, [user])

  // Fetch tasks whenever tab changes
  useEffect(() => {
    if (user) {
      setCurrentPage(1); // Reset to first page when tab changes
      getAllTasks(1, pageSize); // Reset to first page when tab changes
      if (user.role === 'admin') {
        fetchGlobalStats(); // Refresh global stats when tab changes
      }
    }
  }, [activeTab, user])

  // Refetch tasks when filters change
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1); // Reset to first page when filters change
        getAllTasks(1, pageSize); // Reset to first page when filters change
        if (user.role === 'admin') {
          fetchGlobalStats(); // Refresh global stats when filters change
        }
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, statusFilter, priorityFilter, selectedUserId, pageSize, user])

  // Handle page changes
  const handlePageChange = (page: number) => {
    getAllTasks(page, pageSize);
  }

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    getAllTasks(1, newPageSize); // Reset to first page with new page size
  }
  
  const fetchUsers = async () => {
    try {
      const response = await getAPI(USERS.FETCH);
      // Transform users to ensure they have consistent ID format
      const transformedUsers = response.data.map((user: any) => ({
        ...user,
        id: user._id || user.id, // Ensure id field exists for backward compatibility
      }));
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Warning",
        description: "Failed to load users. Some features may be limited.",
        variant: "destructive",
      });
    }
  }

  const fetchGlobalStats = useCallback(async () => {
    // Only fetch analytics for admin users
    if (user?.role !== 'admin') {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    try {
      // Build query parameters for stats
      const queryParams = new URLSearchParams();
      
      // Add user filter for admin
      if (selectedUserId !== 'all') {
        queryParams.append('assignee', selectedUserId);
      }

      const url = queryParams.toString() 
        ? `${TASK.ANALYTICS}?${queryParams.toString()}`
        : TASK.ANALYTICS;
        
      const response = await getAPI(url);
      console.log('Analytics API response:', response);
      console.log('API call success:', response.success);
      console.log('API call data exists:', !!response.data);
      if (response.success && response.data) {
        // Transform the backend data to match frontend expectations
        const backendData = response.data;
        console.log('Backend analytics data:', backendData);
        console.log('Backend totalTasks (should exclude completed):', backendData.totalTasks);
        console.log('Backend completedTasks:', backendData.completedTasks);
        console.log('Backend allTasks:', backendData.allTasks);
        
        // Calculate today's hours worked by team members
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todaysHours = tasks.reduce((total, task) => {
          if (!task.workSessions || !Array.isArray(task.workSessions)) return total;
          
          return total + task.workSessions.reduce((sessionTotal, session) => {
            const sessionDate = new Date(session.startTime);
            sessionDate.setHours(0, 0, 0, 0);
            
            // Check if session is from today
            if (sessionDate.getTime() === today.getTime() && session.duration) {
              return sessionTotal + session.duration;
            }
            return sessionTotal;
          }, 0);
        }, 0);
        
        console.log('Today\'s hours calculation:', {
          today: today.toISOString().split('T')[0],
          todaysHours,
          todaysHoursInHours: Math.round(todaysHours / 60 * 10) / 10
        });
        
        const transformedStats = {
          totalTasks: backendData.totalTasks,
          activeUsers: backendData.tasksByAssignee?.length || 0,
          activeTasks: backendData.activeTimers,
          totalTimeSpent: Math.round(todaysHours / 60 * 10) / 10, // Convert to hours with 1 decimal
          completedTasks: backendData.completedTasks,
          inProgressTasks: backendData.inProgressTasks,
          todoTasks: backendData.todoTasks,
          overdueTasks: backendData.overdueTasks,
          completionRate: backendData.completionRate
        };
        console.log('Transformed global stats:', transformedStats);
        setGlobalStats(transformedStats);
      }
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
      console.log('API call failed, will use fallback calculation');
      toast({
        title: "Warning",
        description: "Failed to load statistics.",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  }, [user?.role, selectedUserId, tasks]);

  const getAllTasks = async (page: number = currentPage, limit: number = pageSize) => {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add status filter based on active tab
      if (activeTab === 'completed') {
        queryParams.append('status', 'completed');
      } else if (activeTab === 'tasks') {
        // For active tasks, exclude completed
        if (statusFilter !== 'all') {
          queryParams.append('status', statusFilter);
        } else {
          queryParams.append('excludeStatus', 'completed');
        }
      }

      // Add other filters
      if (priorityFilter !== 'all') {
        queryParams.append('priority', priorityFilter);
      }
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }
      if (user?.role === 'admin' && selectedUserId !== 'all') {
        queryParams.append('assignee', selectedUserId);
      }

      const response = await getAPI(`${TASK.FETCH}?${queryParams.toString()}`);
      setTasks(response.data);
      setPaginationData(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTask = async(taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    assignee?: string;
    assignees: string[];
    dueDate?: string;
    tags: string[];
  }) => {
    setLoading(true);
    // Prepare the task data for backend
    const backendTaskData = {
      ...taskData,
      assignee: taskData.assignee || undefined,
      assignees: taskData.assignees || [],
    };

    const newTask: Task = {
      _id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      assignee: taskData.assignee,
      assignees: [], // Will be populated when the response comes back
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: taskData.dueDate,
      tags: taskData.tags,
      timeSpent: 0,
      activeTimers: [], // Add missing activeTimers property
      isTimerRunning: false,
      workSessions: [],
      comments: []
    };

    try{
      const response = await postAPI(TASK.CREATE, backendTaskData);
      
      if (response?.data?.success) {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
        
        // Refresh tasks list to show the new task
        getAllTasks(1, pageSize); // Reset to first page to see new task
        setCurrentPage(1);
        if (user?.role === 'admin') {
          fetchGlobalStats(); // Refresh global stats
        }
      }
    }
    catch(error) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async(taskId: string, updates: Partial<Task>) => {
    // Set loading state for update
    setTaskLoadingStates(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], update: true }
    }));

    try{
      const task = tasks.find(t => t._id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Update task in the backend
      const response = await putAPI(TASK.UPDATE(taskId), { ...task, ...updates });
      if(response?.data?.success) {
        // Update local state immediately for better UX
        setTasks(prev => prev.map(t => 
          t._id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ));
        
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
        
        // Refresh current page to reflect changes and get latest data
        getAllTasks(currentPage, pageSize);
        if (user?.role === 'admin') {
          fetchGlobalStats(); // Refresh global stats
        }
      }
    }
    catch(error) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update task",
        variant: "destructive",
      });
    } finally {
      // Clear loading state for update
      setTaskLoadingStates(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], update: false }
      }));
    }
  };

  // Helper function to handle status updates with loading
  const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    // Set loading state for status
    setTaskLoadingStates(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], status: true }
    }));

    try {
      await handleUpdateTask(taskId, { status: newStatus });
    } finally {
      // Clear loading state for status
      setTaskLoadingStates(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], status: false }
      }));
    }
  };

  const handleDeleteTask = async(taskId: string) => {
    // Set loading state for delete
    setTaskLoadingStates(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], delete: true }
    }));

    try{
      const task = tasks.find(t => t._id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Delete task in the backend
      const response = await deleteAPI(TASK.DELETE(taskId));

      // @ts-ignore 
      if(response?.data?.success) {
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
        
        // Refresh current page, but if this was the last item on the page, go to previous page
        const remainingItems = paginationData.total - 1;
        const maxPage = Math.ceil(remainingItems / pageSize);
        const targetPage = currentPage > maxPage ? Math.max(1, maxPage) : currentPage;
        
        getAllTasks(targetPage, pageSize);
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        }
        if (user?.role === 'admin') {
          fetchGlobalStats(); // Refresh global stats
        }
      }
    }
    catch(error) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      // Clear loading state for delete
      setTaskLoadingStates(prev => {
        const newStates = { ...prev };
        delete newStates[taskId]; // Remove the entire loading state for deleted task
        return newStates;
      });
    }
  };

  const handleStartTimer = async (taskId: string) => {
    // Set loading state for timer
    setTaskLoadingStates(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], timer: true }
    }));

    try {
      const response = await postAPIWithoutBody(TASK.TIMER_START(taskId));
      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Timer started successfully",
        });
        
        // Refresh current page to reflect timer changes
        getAllTasks(currentPage, pageSize);
        if (user?.role === 'admin') {
          fetchGlobalStats(); // Refresh global stats
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message || "Failed to start timer",
        variant: "destructive",
      });
    } finally {
      // Clear loading state for timer
      setTaskLoadingStates(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], timer: false }
      }));
    }
  };

  const handleStopTimer = async (taskId: string) => {
    // Set loading state for timer
    setTaskLoadingStates(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], timer: true }
    }));

    try {
      const response = await postAPIWithoutBody(TASK.TIMER_STOP(taskId));
      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Timer stopped successfully",
        });
        
        // Refresh current page to reflect timer changes
        getAllTasks(currentPage, pageSize);
        if (user?.role === 'admin') {
          fetchGlobalStats(); // Refresh global stats
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message || "Failed to stop timer",
        variant: "destructive",
      });
    } finally {
      // Clear loading state for timer
      setTaskLoadingStates(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], timer: false }
      }));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const activeFiltersCount = [
    searchQuery,
    statusFilter !== 'all' ? statusFilter : null,
    priorityFilter !== 'all' ? priorityFilter : null,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {user?.role === 'admin' ? 'Team Overview' : 'My Tasks'}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {user?.role === 'admin' 
                ? 'Monitor team progress and track all tasks' 
                : 'Manage your tasks and track your progress'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="w-4 h-4 mr-1" />
                Kanban
              </Button>
            </div>
            
          {user?.role === 'admin' ? (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="transition-all duration-300 bg-gradient-primary hover:shadow-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>) : null}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {user?.role === 'admin' ? (
            <>
              <StatsCard
                title="Active Tasks"
                value={stats.totalTasks}
                icon={Target}
                description="Active tasks across all team members"
              />
              <StatsCard
                title="Active Users"
                value={stats.activeUsers}
                icon={Users}
                description="Team members with tasks"
              />
              <StatsCard
                title="Active Timers"
                value={stats.activeTasks}
                icon={Timer}
                description="Tasks currently being worked on"
              />
              <StatsCard
                title="Today's Hours"
                value={`${stats.totalTimeSpent}h`}
                icon={BarChart3}
                description="Hours worked today by team members"
              />
            </>
          ) : (
            <>
              <StatsCard
                title="Active Tasks"
                value={stats.totalTasks}
                icon={Target}
                description="Your active assigned tasks"
              />
              <StatsCard
                title="Completed"
                value={stats.completedTasks}
                icon={CheckCircle}
                description="Tasks finished"
              />
              <StatsCard
                title="In Progress"
                value={stats.inProgressTasks}
                icon={Clock}
                description="Currently working on"
              />
              <StatsCard
                title="Overdue"
                value={stats.overdueTasks}
                icon={AlertTriangle}
                description="Need attention"
                className={stats.overdueTasks > 0 ? "border-destructive" : ""}
              />
            </>
          )}
        </div>

        {/* Modals */}
        <CreateTaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          users={users}
          onCreateTask={handleCreateTask}
          isLoading={loading}
        />
        
        <SessionsModal
          open={showSessionsModal}
          onOpenChange={setShowSessionsModal}
          tasks={userTasks}
          users={users}
          selectedUserId={user?.role === 'admin' ? selectedUserId : undefined}
          onUserFilterChange={user?.role === 'admin' ? setSelectedUserId : undefined}
        />

        {/* Filters */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col flex-1 gap-4 sm:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {user?.role === 'admin' && (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Team Member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    {users.length === 0 ? (
                      <SelectItem value="loading" disabled>Loading users...</SelectItem>
                    ) : (
                      users.map(u => {
                        const userId = getUserId(u);
                        return (
                          <SelectItem key={userId} value={userId}>
                            {u.name}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
              
              <Select value={statusFilter} onValueChange={(value: TaskStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(value: TaskPriority | 'all') => setPriorityFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-6' : 'grid-cols-4'}`}>
            <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="sessions">Work Sessions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {user?.role === 'admin' && <TabsTrigger value="timers">Active Timers</TabsTrigger>}
            {user?.role === 'admin' && <TabsTrigger value="users">Team Management</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Active Tasks ({stats.totalTasks})
              </h2>
            </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <TaskCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <>              
              {filteredActiveTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-muted">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No active tasks found</h3>
                  <p className="mb-4 text-muted-foreground">
                    {userTasks.filter(t => t.status !== 'completed').length === 0 
                      ? "Create your first task to get started"
                      : "Try adjusting your filters to see more tasks"
                    }
                  </p>
                  {userTasks.filter(t => t.status !== 'completed').length === 0 && (
                    <Button 
                      onClick={() => alert("Contact admin to create task")}
                      className="bg-gradient-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {viewMode === 'kanban' ? (
                        <KanbanBoard 
                          tasks={filteredTasks} 
                          users={users}
                          onStartTimer={handleStartTimer}
                          onStopTimer={handleStopTimer}
                          onUpdateTask={handleUpdateTask}
                          onDeleteTask={handleDeleteTask}
                          selectedUserId={selectedUserId}
                        />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredActiveTasks.map((task) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              users={users}
                              onUpdateTask={handleUpdateTask}
                              onDeleteTask={handleDeleteTask}
                              onStartTimer={handleStartTimer}
                              onStopTimer={handleStopTimer}
                              showAssignee={user?.role === 'admin'}
                              isLoading={taskLoadingStates[task._id] || {}}
                            />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Pagination Controls */}
              {!loading && (
                <TaskPagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={paginationData.total}
                  totalPages={paginationData.pages}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  itemName="tasks"
                />
              )}
            </>
          )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Completed Tasks ({paginationData.total})
              </h2>
            </div>

            {filteredCompletedTasks.length === 0 ? (
              <div className="py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-muted">
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No completed tasks</h3>
                <p className="text-muted-foreground">
                  Complete some tasks to see them here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompletedTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    users={users}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onStartTimer={handleStartTimer}
                    onStopTimer={handleStopTimer}
                    showAssignee={user?.role === 'admin'}
                    isLoading={taskLoadingStates[task._id] || {}}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls for Completed Tasks */}
            {!loading && activeTab === 'completed' && (
              <TaskPagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={paginationData.total}
                totalPages={paginationData.pages}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                itemName="completed tasks"
              />
            )}
          </TabsContent>
          
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Work Sessions</h2>
            </div>
            <SessionsList 
              tasks={userTasks}
              users={users}
              selectedUserId={user?.role === 'admin' ? selectedUserId : undefined}
              onUserFilterChange={user?.role === 'admin' ? setSelectedUserId : undefined}
              onSessionUpdated={(updatedTask) => {
                // Update the task in the current page
                setTasks(prev => prev.map(task => 
                  task._id === updatedTask._id ? updatedTask : task
                ));
              }}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <TaskAnalytics 
              tasks={userTasks}
              users={users}
              selectedUserId={user?.role === 'admin' ? selectedUserId : undefined}
              onUserFilterChange={user?.role === 'admin' ? setSelectedUserId : undefined}
            />
          </TabsContent>

          {user?.role === 'admin' && (
            <TabsContent value="timers" className="space-y-4">
              <ActiveTimers onRefresh={getAllTasks} />
            </TabsContent>
          )}

          {user?.role === 'admin' && (
            <TabsContent value="users" className="space-y-4">
              <UserManagement onUsersUpdate={() => {}} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};