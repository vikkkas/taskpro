import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User } from '@/types/auth';
import { users as initialUsers } from '@/data/staticData';
import { Plus, UserX, Mail, Building, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserManagementProps {
  onUsersUpdate: (users: User[]) => void;
}

export const UserManagement = ({ onUsersUpdate }: UserManagementProps) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '',
    role: 'team-member' as 'team-member' | 'admin'
  });
  const { toast } = useToast();

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`
    };

    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    onUsersUpdate(updatedUsers);
    
    setNewUser({ name: '', email: '', department: '', role: 'team-member' });
    setShowCreateDialog(false);
    
    toast({
      title: "Success",
      description: `User ${user.name} has been created successfully`
    });
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    onUsersUpdate(updatedUsers);
    
    toast({
      title: "User Deleted",
      description: `${userToDelete.name} has been removed from the team`
    });
  };

  const teamMembers = users.filter(u => u.role === 'team-member');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Team Management
            <Badge variant="secondary" className="text-xs">
              {teamMembers.length} members
            </Badge>
          </CardTitle>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={newUser.department} onValueChange={(value) => setNewUser(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Video Production">Video Production</SelectItem>
                      <SelectItem value="Content">Content</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value: 'team-member' | 'admin') => setNewUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team-member">Team Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateUser} className="flex-1">
                    Create User
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No team members yet</p>
            <p className="text-xs mt-1">Add your first team member to get started</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {teamMembers.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="font-medium text-sm">{user.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        <span>{user.department}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </Badge>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {user.name} from the team? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};