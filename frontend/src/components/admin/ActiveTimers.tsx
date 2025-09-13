import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ActiveTimer } from '@/types/task';
import { getAPI, postAPIWithoutBody } from '@/utils/BasicApi';
import { TASK } from '@/utils/apiURL';
import { useToast } from '@/hooks/use-toast';
import { 
  Timer, 
  Play, 
  Pause, 
  Clock, 
  User as UserIcon,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveTimersProps {
  onRefresh?: () => void;
}

export const ActiveTimers = ({ onRefresh }: ActiveTimersProps) => {
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stoppingTimer, setStoppingTimer] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchActiveTimers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      const response = await getAPI(`${TASK}/active-timers`);
      if (response.success) {
        setActiveTimers(response.data);
      }
    } catch (error) {
      console.error('Error fetching active timers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch active timers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStopTimer = async (taskId: string) => {
    try {
      setStoppingTimer(taskId);
      const response = await postAPIWithoutBody(`${TASK}/${taskId}/timer/stop`);
      
      if (response.success) {
        toast({
          title: "Timer Stopped",
          description: "Timer has been stopped successfully",
        });
        fetchActiveTimers();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    } finally {
      setStoppingTimer(null);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimerStartedByName = (timer: ActiveTimer) => {
    if (typeof timer.timerStartedBy === 'object' && timer.timerStartedBy) {
      return timer.timerStartedBy.name;
    }
    return 'Unknown';
  };

  const getTimerStartedByAvatar = (timer: ActiveTimer) => {
    if (typeof timer.timerStartedBy === 'object' && timer.timerStartedBy) {
      return timer.timerStartedBy.avatar;
    }
    return undefined;
  };

  useEffect(() => {
    fetchActiveTimers();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveTimers(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Active Timers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Active Timers ({activeTimers.length})
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchActiveTimers(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {activeTimers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active timers running</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTimers.map((timer) => (
              <div
                key={timer._id}
                className={cn(
                  "p-4 border rounded-lg transition-all duration-300",
                  "bg-gradient-to-r from-primary/5 to-primary/10",
                  "border-primary/20 shadow-sm hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{timer.title}</h4>
                      <Badge 
                        variant="secondary" 
                        className="animate-pulse bg-green-100 text-green-800"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Running
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        <span>Started by: {getTimerStartedByName(timer)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Session: {formatDuration(timer.currentSessionDuration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        <span>Total: {formatDuration(timer.totalTimeSpent)}</span>
                      </div>
                    </div>

                    {timer.assignees && timer.assignees.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Assigned to:</span>
                        <div className="flex items-center gap-1">
                          {timer.assignees.slice(0, 3).map((assignee, index) => {
                            const user = typeof assignee === 'object' ? assignee : null;
                            return (
                              <Avatar key={index} className="w-6 h-6">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {user?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })}
                          {timer.assignees.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{timer.assignees.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleStopTimer(timer._id)}
                    disabled={stoppingTimer === timer._id}
                    className="ml-2"
                  >
                    {stoppingTimer === timer._id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Stopping...
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Stop
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
