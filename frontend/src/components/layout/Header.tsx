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
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary">
              {/* <BarChart3 className="w-4 h-4 text-primary-foreground" /> */}
              <img className='rounded-xl' src="../../../public/favicon.ico" alt="" />
            </div>
            <h1 className="text-xl font-bold text-transparent bg-gradient-primary bg-clip-text">
              TaskFlow
            </h1>
          </div>
          
          <div className="items-center hidden space-x-1 text-sm md:flex text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{user.department}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsChangePasswordOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden ml-2 md:inline">Settings</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden ml-2 md:inline">Logout</span>
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