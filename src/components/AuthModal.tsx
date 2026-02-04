import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthStep = "main" | "email" | "password" | "username" | "login";

const emailSchema = z.string().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [step, setStep] = useState<AuthStep>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("main");
        setEmail("");
        setPassword("");
        setUsername("");
        setError("");
        setShowPassword(false);
      }, 300);
    }
  }, [open]);

  // Listen for auth state changes to close modal on success
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        onOpenChange(false);
        toast({
          title: "Welcome!",
          description: "You're now signed in.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [onOpenChange, toast]);

  const generateUsername = (email: string) => {
    const localPart = email.split("@")[0];
    const cleaned = localPart.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
    const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${cleaned}${suffix}`;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        if (error.message.includes("already registered") || error.message.includes("exists")) {
          setError("An account with this email already exists. Try logging in instead.");
        } else {
          setError(error.message);
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        if (error.message.includes("already registered") || error.message.includes("exists")) {
          setError("An account with this email already exists. Try logging in instead.");
        } else {
          setError(error.message);
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailContinue = () => {
    setError("");
    try {
      emailSchema.parse(email);
      setStep("password");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid email");
    }
  };

  const handlePasswordContinue = () => {
    setError("");
    try {
      passwordSchema.parse(password);
      const suggested = generateUsername(email);
      setUsername(suggested);
      setStep("username");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid password");
    }
  };

  const handleSignUp = async () => {
    setError("");
    
    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: username,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("This email is already registered. Try logging in.");
        } else {
          setError(signUpError.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: username,
          email: email,
        });
      }

      // Close modal and show success
      onOpenChange(false);
      toast({
        title: "Account created!",
        description: "Check your email to verify your account.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid input");
      return;
    }

    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login")) {
          setError("Invalid email or password");
        } else {
          setError(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      // Auth state change listener will close the modal
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="absolute left-5 top-5 p-2 rounded-full hover:bg-muted transition-colors"
      type="button"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );

  const renderMainStep = () => (
    <div className="flex flex-col items-center pt-8 pb-6 px-6">
      {/* Logo/Brand */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6">
        <span className="text-2xl font-bold text-primary-foreground">S</span>
      </div>

      <h1 className="text-2xl font-semibold text-center mb-2">Create your account</h1>
      <p className="text-muted-foreground text-center text-sm mb-8">
        Join SWAM to discover amazing experiences
      </p>

      <div className="w-full space-y-3">
        {/* Google */}
        <Button
          variant="outline"
          className="w-full h-12 text-[15px] font-medium rounded-xl border-border hover:bg-muted/50 transition-all"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        {/* Apple */}
        <Button
          variant="outline"
          className="w-full h-12 text-[15px] font-medium rounded-xl border-border hover:bg-muted/50 transition-all"
          onClick={handleAppleSignIn}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email */}
        <Button
          variant="outline"
          className="w-full h-12 text-[15px] font-medium rounded-xl border-border hover:bg-muted/50 transition-all"
          onClick={() => setStep("email")}
          disabled={isLoading}
        >
          Continue with email
        </Button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 w-full">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      )}

      {/* Terms */}
      <p className="text-xs text-muted-foreground text-center mt-6 px-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>

      {/* Login link */}
      <div className="mt-6 pt-6 border-t border-border w-full text-center">
        <span className="text-sm text-muted-foreground">Already have an account? </span>
        <button
          onClick={() => setStep("login")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Log in
        </button>
      </div>
    </div>
  );

  const renderEmailStep = () => (
    <div className="flex flex-col pt-16 pb-6 px-6">
      <BackButton onClick={() => setStep("main")} />

      <h1 className="text-2xl font-semibold text-center mb-2">What's your email?</h1>
      <p className="text-muted-foreground text-center text-sm mb-8">
        We'll use this to create your account
      </p>

      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl text-base px-4"
          onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
          autoFocus
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          className="w-full h-12 rounded-xl text-base font-medium"
          onClick={handleEmailContinue}
          disabled={!email.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="flex flex-col pt-16 pb-6 px-6">
      <BackButton onClick={() => setStep("email")} />

      <h1 className="text-2xl font-semibold text-center mb-2">Create a password</h1>
      <p className="text-muted-foreground text-center text-sm mb-8">
        Use at least 6 characters
      </p>

      <div className="space-y-4">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl text-base px-4 pr-12"
            onKeyDown={(e) => e.key === "Enter" && handlePasswordContinue()}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          className="w-full h-12 rounded-xl text-base font-medium"
          onClick={handlePasswordContinue}
          disabled={!password.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderUsernameStep = () => (
    <div className="flex flex-col pt-16 pb-6 px-6">
      <BackButton onClick={() => setStep("password")} />

      <h1 className="text-2xl font-semibold text-center mb-2">Choose a username</h1>
      <p className="text-muted-foreground text-center text-sm mb-8">
        This is how others will see you
      </p>

      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
          <Input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            className="h-12 rounded-xl text-base pl-9 pr-4"
            maxLength={20}
            onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
            autoFocus
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          You can change this anytime in settings
        </p>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          className="w-full h-12 rounded-xl text-base font-medium"
          onClick={handleSignUp}
          disabled={isLoading || !username.trim()}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Create account"
          )}
        </Button>
      </div>
    </div>
  );

  const renderLoginStep = () => (
    <div className="flex flex-col pt-16 pb-6 px-6">
      <BackButton onClick={() => setStep("main")} />

      <h1 className="text-2xl font-semibold text-center mb-8">Welcome back</h1>

      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl text-base px-4"
          autoFocus
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl text-base px-4 pr-12"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          className="w-full h-12 rounded-xl text-base font-medium"
          onClick={handleLogin}
          disabled={isLoading || !email.trim() || !password.trim()}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Log in"
          )}
        </Button>

        <div className="text-center pt-2">
          <span className="text-sm text-muted-foreground">Don't have an account? </span>
          <button
            onClick={() => setStep("main")}
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-2xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "main" && renderMainStep()}
        {step === "email" && renderEmailStep()}
        {step === "password" && renderPasswordStep()}
        {step === "username" && renderUsernameStep()}
        {step === "login" && renderLoginStep()}
      </DialogContent>
    </Dialog>
  );
};
