import React, { useState, useEffect } from "react";
import { useAuth, apiClient } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { UserCreate } from "../../types/api";
import { 
  Mail, 
  Lock, 
  UserCircle, 
  Briefcase, 
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm extends UserCreate {
  password: string;
}

interface ClientOption {
  client_id: string;
  name: string;
}

function Login(): React.ReactElement {
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "client",
    client_id: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Fetch available clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await apiClient.get("/auth/clients");
        setAvailableClients(response.data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    const result = await login(loginForm.email, loginForm.password);

    if (result.success) {
      toast.success("Login successful!");
      navigate("/dashboard");
    } else {
      toast.error(result.error || "Login failed");
    }

    setLoading(false);
  };

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    const result = await register(registerForm);

    if (result.success) {
      toast.success("Registration successful! Please log in.");
      setRegisterForm({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "client",
        client_id: "",
      });
    } else {
      toast.error(result.error || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4ODg4ODgiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMS4xLS45LTItMi0yaC0yYy0xLjEgMC0yIC45LTIgMnYyYzAgMS4xLjkgMiAyIDJoMmMxLjEgMCAyLS45IDItMnYtMnptMCAxMGMwLTEuMS0uOS0yLTItMmgtMmMtMS4xIDAtMiAuOS0yIDJ2MmMwIDEuMS45IDIgMiAyaDJjMS4xIDAgMi0uOSAyLTJ2LTJ6TTI2IDI2YzAtMS4xLS45LTItMi0yaC0yYy0xLjEgMC0yIC45LTIgMnYyYzAgMS4xLjkgMiAyIDJoMmMxLjEgMCAyLS45IDItMnYtMnptMTAgMTBjMC0xLjEtLjktMi0yLTJoLTJjLTEuMSAwLTIgLjktMiAydjJjMCAxLjEuOSAyIDIgMmgyYzEuMSAwIDItLjkgMi0ydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-50 rounded-full"></div>
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <Briefcase className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-extrabold">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Lw&w CRM
              </span>
            </h2>
            <p className="mt-3 text-base text-gray-600 font-medium">
              Welcome back! Please sign in to continue
            </p>
          </div>

          {/* Auth Card */}
          <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0 overflow-hidden">
            {/* Decorative Top Border */}
            <div className="h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Authentication
              </CardTitle>
              <CardDescription className="text-base">
                Access your CRM dashboard or create a new account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, email: e.target.value })
                        }
                        className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value })
                        }
                        className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-first-name" className="text-sm font-semibold text-gray-700">
                        First Name
                      </Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="register-first-name"
                          value={registerForm.first_name}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              first_name: e.target.value,
                            })
                          }
                          className="pl-10 h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="John"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-last-name" className="text-sm font-semibold text-gray-700">
                        Last Name
                      </Label>
                      <Input
                        id="register-last-name"
                        value={registerForm.last_name}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            last_name: e.target.value,
                          })
                        }
                        className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-semibold text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            email: e.target.value,
                          })
                        }
                        className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="register-password"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            password: e.target.value,
                          })
                        }
                        className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-role" className="text-sm font-semibold text-gray-700">
                      Select Your Role
                    </Label>
                    <Select
                      value={registerForm.role}
                      onValueChange={(value) =>
                        setRegisterForm({
                          ...registerForm,
                          role: value as "admin" | "agent" | "client",
                          client_id: value === "client" ? registerForm.client_id : undefined,
                        })
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue placeholder="Choose your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-indigo-600" />
                            Client
                          </div>
                        </SelectItem>
                        <SelectItem value="agent">
                          <div className="flex items-center">
                            <UserCircle className="h-4 w-4 mr-2 text-purple-600" />
                            Agent
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <Sparkles className="h-4 w-4 mr-2 text-pink-600" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {registerForm.role === "client" && (
                    <div className="space-y-2 animate-in slide-in-from-top duration-300">
                      <Label htmlFor="register-client-id" className="text-sm font-semibold text-gray-700">
                        Client ID
                      </Label>
                      <Select
                        value={registerForm.client_id}
                        onValueChange={(value) =>
                          setRegisterForm({
                            ...registerForm,
                            client_id: value,
                          })
                        }
                      >
                        <SelectTrigger className="h-12 border-indigo-300 bg-indigo-50/50 focus:border-indigo-500 focus:ring-indigo-500">
                          <SelectValue placeholder="Select your client ID" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClients.map((client) => (
                            <SelectItem key={client.client_id} value={client.client_id}>
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 mr-2 text-indigo-600" />
                                <span className="font-mono font-semibold">{client.client_id}</span>
                                <span className="ml-2 text-gray-500">- {client.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-indigo-600 flex items-center mt-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Required for client registration
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <CheckCircle2 className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Secure authentication powered by{" "}
            <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Lw&w CRM
            </span>
          </p>
        </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default Login;
