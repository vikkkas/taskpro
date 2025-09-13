import { useState, useMemo, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskLoadingStates, setTaskLoadingStates] = useState<Record<string, {
    timer?: boolean;
    status?: boolean;
    delete?: boolean;
    update?: boolean;
  }>>({});

  // Helper function to get user ID (handles both _id and id)
  const getUserId = (user: User): string => user._id || user.id || '';
  const getCurrentUserId = (): string => {
    if (!user) return '';
    return user._id || user.id || '';
  };

  // Filter tasks based on user role
  const userTasks = useMemo(() => {
    if (!user) {
      return [];
    }
    
    if (user.role === 'admin') {
      return tasks;
    }
    
    const currentUserId = getCurrentUserId();
    
    const filtered = tasks.filter(task => {
      // Handle both string and object assignees
      let assigneeId = null;
      
      if (typeof task.assignee === 'string') {
        assigneeId = task.assignee;
      } else if (task.assignee && typeof task.assignee === 'object') {
        assigneeId = task.assignee._id || task.assignee.id;
      }
      
      return assigneeId === currentUserId;
    });
    
    return filtered;
  }, [tasks, user]);

  // Filter tasks by selected user (admin only)
  const adminFilteredTasks = useMemo(() => {
    if (user?.role !== 'admin' || selectedUserId === 'all') {
      return userTasks;
    }
    
    // Filter tasks by the selected user ID
    const filtered = userTasks.filter(task => {
      // Handle both string and object assignees
      let assigneeId = null;
      
      if (typeof task.assignee === 'string') {
        assigneeId = task.assignee;
      } else if (task.assignee && typeof task.assignee === 'object') {
        assigneeId = task.assignee._id || task.assignee.id;
      }
      
      return assigneeId === selectedUserId;
    });
    
    return filtered;
  }, [userTasks, selectedUserId, user?.role]);

  // Apply filters to active tasks (non-completed)
  const filteredActiveTasks = useMemo(() => {
    return adminFilteredTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const isNotCompleted = task.status !== 'completed';
      
      return matchesSearch && matchesStatus && matchesPriority && isNotCompleted;
    });
  }, [adminFilteredTasks, searchQuery, statusFilter, priorityFilter]);

  // Apply filters to completed tasks
  const filteredCompletedTasks = useMemo(() => {
    return adminFilteredTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const isCompleted = task.status === 'completed';
      
      return matchesSearch && matchesPriority && isCompleted;
    });
  }, [adminFilteredTasks, searchQuery, priorityFilter]);

  // Keep original filteredTasks for backward compatibility
  const filteredTasks = useMemo(() => {
    return adminFilteredTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [adminFilteredTasks, searchQuery, statusFilter, priorityFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    // Use adminFilteredTasks for calculations to reflect current filter
    const tasksForStats = user?.role === 'admin' ? adminFilteredTasks : userTasks;
    
    const totalTasks = tasksForStats.length;
    const completedTasks = tasksForStats.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasksForStats.filter(t => t.status === 'in-progress').length;
    const activeTasks = tasksForStats.filter(t => t.isTimerRunning).length;
    const overdueTasks = tasksForStats.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;
    const totalTimeSpent = tasksForStats.reduce((total, task) => total + task.timeSpent, 0);

    if (user?.role === 'admin') {
      const activeUsers = [...new Set(tasksForStats.map(t => t.assignee))].length;
      return {
        totalTasks,
        activeUsers,
        activeTasks,
        totalTimeSpent: Math.floor(totalTimeSpent / 60), // Convert to hours
      };
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
    };
  }, [adminFilteredTasks, userTasks, user?.role]);
  
  useEffect(() => {
    if (user) {  // Only fetch when user is available
      getAllTasks();
      if (user.role === 'admin') {
        fetchUsers();
      }
    }
  }, [user])

  // Fetch tasks whenever tab changes
  useEffect(() => {
    if (user) {
      getAllTasks();
    }
  }, [activeTab, user])
  
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

  const getAllTasks = async () => {
    setLoading(true);
    try {
      const response = await getAPI(TASK.FETCH);
      setTasks(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description:error?.message,
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
      isTimerRunning: false,
      workSessions: [],
      comments: []
    };

    try{
      const response = await postAPI(TASK.CREATE, backendTaskData);
      setTasks(prev => [newTask, ...prev]);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
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
      if(response?.success) {
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      }
      
      setTasks(prev => prev.map(task => 
        task._id === taskId 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      ));
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
      if(response?.success) {
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      }
      
      setTasks(prev => prev.filter(task => task._id !== taskId));
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
        setTasks(prev => prev.map(task =>
          task._id === taskId
            ? { ...task, ...response.data.data, status: 'in-progress' as TaskStatus, updatedAt: new Date().toISOString() }
            : task
        ));
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
        setTasks(prev => prev.map(task =>
          task._id === taskId
            ? { ...task, ...response.data.data, updatedAt: new Date().toISOString() }
            : task
        ));
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
                title="Total Tasks"
                value={stats.totalTasks}
                icon={Target}
                description="Across all team members"
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
                title="Total Time"
                value={`${stats.totalTimeSpent}h`}
                icon={BarChart3}
                description="Time logged by the team"
              />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Tasks"
                value={stats.totalTasks}
                icon={Target}
                description="Your assigned tasks"
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
                Active Tasks ({filteredActiveTasks.length})
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
                      onClick={() => setShowCreateModal(true)}
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
            </>
          )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Completed Tasks ({filteredCompletedTasks.length})
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