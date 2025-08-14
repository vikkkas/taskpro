import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
// import { users } from "@/data/staticData";
import { UserRole } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { postAPI, setAuthToken } from "@/utils/BasicApi";
import { AUTH } from "@/utils/apiURL";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("team-member");
  const [Loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async(e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    try{
      const response = await postAPI(AUTH.LOGIN, { email, password, role: selectedRole });
      setAuthToken(response.data.data.token);
      login(response.data.data);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.data.data.name}!`,
      });
    }
    catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleDemoLogin = (role: UserRole) => {
  //   const demoUser = users.find((u) => u.role === role) || users[0];
  //   login(demoUser);
  //   toast({
  //     title: "Demo Login",
  //     description: `Logged in as ${demoUser.name} (${role})`,
  //   });
  // };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-subtle">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold text-transparent bg-gradient-primary bg-clip-text">
            TaskFlow
          </CardTitle>
          <CardDescription>
            Diviner Media
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
                disabled={Loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  disabled={Loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={Loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value: UserRole) => setSelectedRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team-member">Team Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            <Button
              type="submit"
              className="w-full transition-all duration-300 bg-gradient-primary hover:shadow-glow"
              disabled={Loading}
            >
              {Loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-card text-muted-foreground">
                Or try demo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleDemoLogin("admin")}
              className="text-sm"
            >
              Demo Admin
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDemoLogin("team-member")}
              className="text-sm"
            >
              Demo Team
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
};
