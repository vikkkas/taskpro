import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { users } from '@/data/staticData';
import { UserRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('team-member');
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find user by email or create demo user
    let user = users.find(u => u.email === email);
    
    if (!user && email) {
      // Create demo user for any email
      user = {
        id: Date.now().toString(),
        name: email.split('@')[0],
        email,
        role: selectedRole,
        department: selectedRole === 'admin' ? 'Management' : 'General',
      };
    }
    
    if (user) {
      login({ ...user, role: selectedRole });
      toast({
        title: "Welcome!",
        description: `Logged in as ${selectedRole}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid email",
        variant: "destructive",
      });
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    const demoUser = users.find(u => u.role === role) || users[0];
    login(demoUser);
    toast({
      title: "Demo Login",
      description: `Logged in as ${demoUser.name} (${role})`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            TaskFlow Pro
          </CardTitle>
          <CardDescription>
            Digital Media Task Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team-member">Team Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              Login
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or try demo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleDemoLogin('admin')}
              className="text-sm"
            >
              Demo Admin
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleDemoLogin('team-member')}
              className="text-sm"
            >
              Demo Team
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};