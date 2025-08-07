import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Task, TaskComment } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { users } from '@/data/staticData';
import { MessageSquare, Send, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaskCommentsProps {
  task: Task;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskComments = ({ task, onUpdateTask }: TaskCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isAdminRemark, setIsAdminRemark] = useState(false);

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    const comment: TaskComment = {
      id: Date.now().toString(),
      content: newComment.trim(),
      authorId: user.id,
      authorName: user.name,
      createdAt: new Date().toISOString(),
      isAdminRemark: user.role === 'admin' && isAdminRemark
    };

    onUpdateTask(task.id, {
      comments: [...task.comments, comment]
    });

    setNewComment('');
    setIsAdminRemark(false);
    
    toast({
      title: "Comment Added",
      description: comment.isAdminRemark ? "Admin remark has been added" : "Comment has been added successfully"
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const sortedComments = [...task.comments].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments & Remarks
          <Badge variant="secondary" className="text-xs">
            {task.comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <div className="space-y-3">
          <Textarea
            placeholder={user?.role === 'admin' ? "Add a comment or admin remark..." : "Add a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-20"
          />
          
          <div className="flex items-center justify-between">
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="adminRemark"
                  checked={isAdminRemark}
                  onChange={(e) => setIsAdminRemark(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="adminRemark" className="text-sm flex items-center gap-1">
                  <Crown className="w-4 h-4 text-warning" />
                  Mark as Admin Remark
                </label>
              </div>
            )}
            
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              size="sm"
              className="ml-auto"
            >
              <Send className="w-4 h-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {sortedComments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Be the first to add a comment</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sortedComments.map((comment) => {
              const author = users.find(u => u.id === comment.authorId);
              
              return (
                <div
                  key={comment.id}
                  className={`border rounded-lg p-3 ${
                    comment.isAdminRemark 
                      ? 'border-warning bg-warning/5' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={author?.avatar} />
                      <AvatarFallback>
                        {comment.authorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.authorName}</span>
                        {comment.isAdminRemark && (
                          <Badge variant="outline" className="text-xs border-warning text-warning">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin Remark
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};