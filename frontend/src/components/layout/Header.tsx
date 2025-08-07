import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { LogOut, Clock, Users, BarChart3, Settings } from 'lucide-react';
import { useState } from 'react';

export const Header = () => {
  const { user, logout } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TaskFlow Pro
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{user.department}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsChangePasswordOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline ml-2">Settings</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline ml-2">Logout</span>
          </Button>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};