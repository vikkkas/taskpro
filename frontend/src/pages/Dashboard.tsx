import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { SessionsList } from '@/components/tasks/SessionsList';
import { SessionsModal } from '@/components/tasks/SessionsModal';
import { TaskAnalytics } from '@/components/analytics/TaskAnalytics';
import { UserManagement } from '@/components/admin/UserManagement';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { tasks as initialTasks, users } from '@/data/staticData';
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
import { useToast } from '@/hooks/use-toast';

export const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filter tasks based on user role
  const userTasks = useMemo(() => {
    if (user?.role === 'admin') {
      return tasks;
    }
    return tasks.filter(task => task.assignee === user?.id);
  }, [tasks, user]);

  // Filter tasks by selected user (admin only)
  const adminFilteredTasks = useMemo(() => {
    if (user?.role !== 'admin' || selectedUserId === 'all') {
      return userTasks;
    }
    return userTasks.filter(task => task.assignee === selectedUserId);
  }, [userTasks, selectedUserId, user?.role]);

  // Apply filters
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
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = userTasks.filter(t => t.status === 'in-progress').length;
    const activeTasks = userTasks.filter(t => t.isTimerRunning).length;
    const overdueTasks = userTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;
    const totalTimeSpent = userTasks.reduce((total, task) => total + task.timeSpent, 0);

    if (user?.role === 'admin') {
      const activeUsers = [...new Set(userTasks.map(t => t.assignee))].length;
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
  }, [userTasks, user?.role]);

  const handleCreateTask = (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    assignee: string;
    dueDate?: string;
    tags: string[];
  }) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...taskData,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeSpent: 0,
      isTimerRunning: false,
      workSessions: [],
      comments: []
    };

    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
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
            <p className="text-muted-foreground mt-1">
              {user?.role === 'admin' 
                ? 'Monitor team progress and track all tasks' 
                : 'Manage your tasks and track your progress'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            {user?.role === 'admin' && (
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
            )}
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          onCreateTask={handleCreateTask}
        />
        
        <SessionsModal
          open={showSessionsModal}
          onOpenChange={setShowSessionsModal}
          tasks={userTasks}
          selectedUserId={user?.role === 'admin' ? selectedUserId : undefined}
          onUserFilterChange={user?.role === 'admin' ? setSelectedUserId : undefined}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
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
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="sessions">Work Sessions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {user?.role === 'admin' && <TabsTrigger value="users">Team Management</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Tasks ({filteredTasks.length})
              </h2>
            </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {userTasks.length === 0 
                  ? "Create your first task to get started"
                  : "Try adjusting your filters to see more tasks"
                }
              </p>
              {userTasks.length === 0 && (
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
              {user?.role === 'admin' && viewMode === 'kanban' ? (
                <KanbanBoard
                  tasks={filteredTasks}
                  onUpdateTask={handleUpdateTask}
                  selectedUserId={selectedUserId}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateTask={handleUpdateTask}
                      showAssignee={user?.role === 'admin'}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          </TabsContent>
          
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Work Sessions</h2>
              <Button 
                onClick={() => setShowSessionsModal(true)}
                variant="outline"
                className="gap-2"
              >
                <Timer className="w-4 h-4" />
                Open in Modal
              </Button>
            </div>
            <SessionsList 
              tasks={userTasks}
              selectedUserId={user?.role === 'admin' ? selectedUserId : undefined}
              onUserFilterChange={user?.role === 'admin' ? setSelectedUserId : undefined}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <TaskAnalytics 
              tasks={userTasks}
              selectedUserId={user?.role === 'admin' ? selectedUserId : undefined}
              onUserFilterChange={user?.role === 'admin' ? setSelectedUserId : undefined}
            />
          </TabsContent>
          
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