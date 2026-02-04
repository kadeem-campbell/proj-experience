import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Mail, ArrowLeft, Check, Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthStep = "main" | "email" | "username" | "login";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [step, setStep] = useState<AuthStep>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [suggestedUsername, setSuggestedUsername] = useState("");
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
        setSuggestedUsername("");
        setError("");
      }, 200);
    }
  }, [open]);

  const generateUsername = (email: string) => {
    const localPart = email.split("@")[0];
    // Clean and format username
    const cleaned = localPart
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 15);
    const randomSuffix = Math.floor(Math.random() * 999);
    return `${cleaned}${randomSuffix}`;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
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
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Apple");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContinue = () => {
    setError("");
    try {
      emailSchema.parse(email);
      const suggested = generateUsername(email);
      setSuggestedUsername(suggested);
      setUsername(suggested);
      setStep("username");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid email");
    }
  };

  const handleSignUp = async () => {
    setError("");
    try {
      passwordSchema.parse(password);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid password");
      return;
    }

    if (!username.trim()) {
      setError("Please enter a username");
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
          setError("This email is already registered. Try logging in instead.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Update profile with username
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: username,
          email: email,
        });
      }

      toast({
        title: "Welcome to SWAM!",
        description: "Check your email to verify your account.",
      });
      onOpenChange(false);
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
        setError(signInError.message);
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You're now signed in.",
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMainStep = () => (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold text-center mb-4">Sign up for SWAM</h2>

      {/* Google */}
      <Button
        variant="outline"
        className="w-full h-12 text-base font-medium justify-start gap-3 px-4"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
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
        className="w-full h-12 text-base font-medium justify-start gap-3 px-4"
        onClick={handleAppleSignIn}
        disabled={isLoading}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        Continue with Apple
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email */}
      <Button
        variant="outline"
        className="w-full h-12 text-base font-medium justify-start gap-3 px-4"
        onClick={() => setStep("email")}
        disabled={isLoading}
      >
        <Mail className="w-5 h-5" />
        Use email
      </Button>

      {error && (
        <p className="text-sm text-destructive text-center mt-2">{error}</p>
      )}

      {/* Terms */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        By continuing, you agree to SWAM's{" "}
        <a href="#" className="underline">Terms of Service</a> and{" "}
        <a href="#" className="underline">Privacy Policy</a>
      </p>

      {/* Login link */}
      <div className="text-center mt-4 pt-4 border-t border-border">
        <span className="text-muted-foreground">Already have an account? </span>
        <button
          onClick={() => setStep("login")}
          className="text-primary font-medium hover:underline"
        >
          Log in
        </button>
      </div>
    </div>
  );

  const renderEmailStep = () => (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setStep("main")}
        className="absolute left-4 top-4 p-2 hover:bg-muted rounded-full transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h2 className="text-2xl font-bold text-center mb-2">Enter your email</h2>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
          onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        className="w-full h-12 text-base font-medium"
        onClick={handleEmailContinue}
        disabled={!email.trim()}
      >
        Continue
      </Button>
    </div>
  );

  const renderUsernameStep = () => (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setStep("email")}
        className="absolute left-4 top-4 p-2 hover:bg-muted rounded-full transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h2 className="text-2xl font-bold text-center mb-2">Create your account</h2>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            className="h-12"
            maxLength={20}
          />
          {username === suggestedUsername && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              suggested
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          You can change this later
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12"
          onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        className="w-full h-12 text-base font-medium"
        onClick={handleSignUp}
        disabled={isLoading || !username.trim() || !password.trim()}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5 mr-2" />
            Create Account
          </>
        )}
      </Button>
    </div>
  );

  const renderLoginStep = () => (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setStep("main")}
        className="absolute left-4 top-4 p-2 hover:bg-muted rounded-full transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h2 className="text-2xl font-bold text-center mb-2">Log in</h2>

      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        className="w-full h-12 text-base font-medium"
        onClick={handleLogin}
        disabled={isLoading || !email.trim() || !password.trim()}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Log in"
        )}
      </Button>

      <div className="text-center mt-2">
        <span className="text-muted-foreground">Don't have an account? </span>
        <button
          onClick={() => setStep("main")}
          className="text-primary font-medium hover:underline"
        >
          Sign up
        </button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 gap-0">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "main" && renderMainStep()}
        {step === "email" && renderEmailStep()}
        {step === "username" && renderUsernameStep()}
        {step === "login" && renderLoginStep()}
      </DialogContent>
    </Dialog>
  );
};
