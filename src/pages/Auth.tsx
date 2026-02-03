import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Lock, Eye, EyeOff, Compass, UserPlus, Loader2 } from 'lucide-react';
import { validateEmail, validatePassword, sanitizeInput } from '@/utils/inputValidation';

const Auth = () => {
  const [step, setStep] = useState<'role' | 'auth'>('role');
  const [selectedRole, setSelectedRole] = useState<'traveler' | 'creator' | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
      setCheckingAuth(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleRoleSelect = (role: 'traveler' | 'creator') => {
    setSelectedRole(role);
    setStep('auth');
    setIsLogin(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Input validation
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid && !isLogin) {
      toast({
        title: "Invalid password",
        description: passwordValidation.errors.join('. '),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const sanitizedFullName = sanitizeInput(fullName);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please check your credentials and try again.",
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email not verified",
              description: "Please check your email and click the verification link before signing in.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
      } else {
        // Sign up
        if (!sanitizedFullName.trim()) {
          toast({
            title: "Name required",
            description: "Please enter your full name",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error, data } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: sanitizedFullName,
              role: selectedRole || 'traveler',
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
            setIsLogin(true);
            setLoading(false);
            return;
          }
          throw error;
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
          toast({
            title: "Check your email!",
            description: "We've sent you a verification link. Please check your email to complete registration.",
          });
        } else if (data.session) {
          toast({
            title: "Account created!",
            description: `Welcome to SWAM AI as a ${selectedRole}!`,
          });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToRoleSelection = () => {
    setStep('role');
    setSelectedRole(null);
    setIsLogin(true);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      {/* Header Navigation */}
      <div className="absolute top-4 left-4">
        <Link to="/" className="text-foreground hover:text-primary transition-colors">
          <Button variant="ghost" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>
      
      <Card className="w-full max-w-lg p-8 backdrop-blur-sm bg-card/90 border-border/60 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            SWAM AI
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {step === 'role' ? 'Choose your journey' : 
             isLogin ? 'Welcome back!' : 
             `Join as a ${selectedRole}`}
          </p>
        </div>

        {step === 'role' ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">How do you want to use SWAM AI?</h2>
              <p className="text-sm text-muted-foreground">Select your role to get started</p>
            </div>
            
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-primary/5 border-2 hover:border-primary/20"
                onClick={() => handleRoleSelect('traveler')}
              >
                <Compass className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">I'm a Traveler</div>
                  <div className="text-xs text-muted-foreground">Discover and book experiences</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-secondary/5 border-2 hover:border-secondary/20"
                onClick={() => handleRoleSelect('creator')}
              >
                <UserPlus className="w-6 h-6 text-secondary" />
                <div className="text-center">
                  <div className="font-semibold">I'm a Creator</div>
                  <div className="text-xs text-muted-foreground">Create and manage experiences</div>
                </div>
              </Button>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground mb-2">Already have an account?</p>
              <Button
                variant="link"
                onClick={() => {
                  setStep('auth');
                  setIsLogin(true);
                }}
                className="p-0 h-auto font-semibold"
              >
                Sign in here
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {selectedRole && !isLogin && (
              <div className="flex items-center justify-between mb-6 p-3 bg-primary/5 rounded-lg border">
                <div className="flex items-center gap-2">
                  {selectedRole === 'creator' ? (
                    <UserPlus className="w-4 h-4 text-secondary" />
                  ) : (
                    <Compass className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-sm font-medium capitalize">{selectedRole}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToRoleSelection}
                  className="text-xs"
                >
                  Change
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLogin ? "Enter your password" : "Create a password (min 6 chars)"}
                    required
                    disabled={loading}
                    className="pr-10"
                    minLength={6}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : `Sign Up${selectedRole ? ` as ${selectedRole}` : ''}`
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => {
                  if (isLogin) {
                    resetToRoleSelection();
                  } else {
                    setIsLogin(true);
                  }
                }}
                className="p-0 h-auto font-semibold"
                disabled={loading}
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Auth;
