import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema, forgotPasswordSchema, type LoginInput, type ForgotPasswordInput } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, UserPlus, LogIn, Shield, Zap, Wallet, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSubmitting, setForgotPasswordSubmitting] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginInput>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(data.email, data.password);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
      } else {
        await register(data.email, data.password);
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
      }
    } catch (error: any) {
      let message = "An error occurred";
      if (error?.message) {
        try {
          // Error format is: "STATUS: {json response}"
          const jsonStart = error.message.indexOf('{');
          if (jsonStart !== -1) {
            const parsed = JSON.parse(error.message.substring(jsonStart));
            message = parsed.message || error.message;
          } else {
            message = error.message.replace(/^\d+:\s*/, '');
          }
        } catch {
          message = error.message.replace(/^\d+:\s*/, '');
        }
      }
      toast({
        title: isLogin ? "Unable to sign in" : "Unable to create account",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    form.reset();
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordInput) => {
    setForgotPasswordSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.message || "Failed to send reset email",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "Password reset link sent to your inbox",
        });
        forgotPasswordForm.reset();
        setShowForgotPassword(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setForgotPasswordSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left sidebar with features */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-primary/25 via-secondary/10 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
        
        <div className="relative z-10 flex flex-col justify-center p-8 lg:p-12">
          <div className="space-y-8">
            <div className="space-y-6 max-w-md">
              <h2 className="text-4xl font-bold text-foreground leading-tight">
                Welcome to GrowVend
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20 hover-elevate transition-all">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Secure Transactions</h3>
                    <p className="text-xs text-muted-foreground mt-1">Your purchases are protected</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20 hover-elevate transition-all">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Instant Delivery</h3>
                    <p className="text-xs text-muted-foreground mt-1">Items delivered instantly</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20 hover-elevate transition-all">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Easy Wallet System</h3>
                    <p className="text-xs text-muted-foreground mt-1">Track all transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side with auth form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-background">
        <div className="w-full max-w-sm space-y-6 sm:space-y-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                GrowVend
              </CardTitle>
              <CardDescription className="text-sm text-center text-muted-foreground">
                {isLogin 
                  ? "Sign in to your account and start shopping" 
                  : "Create your account to get started"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 sm:space-y-7">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="name@gmail.com"
                              className="pl-10 h-10 text-sm"
                              autoComplete="email"
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {!isLogin && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground" />
                            Gmail accounts only
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              type="password"
                              placeholder={isLogin ? "••••••••" : "Create a strong password"}
                              className="pl-10 h-10 text-sm"
                              autoComplete={isLogin ? "current-password" : "new-password"}
                              data-testid="input-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {!isLogin && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground" />
                            Minimum 6 characters
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-10 mt-1 font-medium"
                    disabled={isSubmitting}
                    data-testid="button-submit-auth"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isLogin ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      <>
                        {isLogin ? (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Account
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    {isLogin ? "New here?" : "Have account?"}
                  </span>
                </div>
              </div>

              {/* Toggle Mode Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 font-medium"
                onClick={toggleMode}
                data-testid="button-toggle-auth-mode"
              >
                {isLogin ? "Create a new account" : "Sign in to existing account"}
              </Button>

              {/* Forgot Password Link */}
              {isLogin && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-9 text-sm font-medium text-primary"
                  onClick={() => setShowForgotPassword(true)}
                  data-testid="button-forgot-password"
                >
                  Forgot your password?
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Terms of Service */}
          <p className="text-center text-xs text-muted-foreground px-2 leading-relaxed">
            By continuing, you agree to our
            <br />
            <span className="font-medium">Terms of Service</span> and <span className="font-medium">Privacy Policy</span>
          </p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md gap-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold">Reset Password</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a secure link to reset your password.
            </DialogDescription>
          </DialogHeader>

          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-5">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 h-10 text-sm"
                          autoComplete="email"
                          data-testid="input-forgot-password-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={forgotPasswordSubmitting}
                  data-testid="button-cancel-reset"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 font-medium"
                  disabled={forgotPasswordSubmitting}
                  data-testid="button-send-reset-link"
                >
                  {forgotPasswordSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Link
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
