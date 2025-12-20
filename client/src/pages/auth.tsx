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
import { Loader2, Mail, Lock, UserPlus, LogIn, Shield, Zap, Wallet, ShoppingBag, ArrowLeft } from "lucide-react";

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
          const parsed = JSON.parse(error.message.replace(/^\d+:\s*/, ''));
          message = parsed.message || error.message;
        } catch {
          message = error.message.replace(/^\d+:\s*/, '');
        }
      }
      toast({
        title: "Unable to sign in",
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
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-primary/25 via-secondary/10 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
        
        <div className="relative z-10 flex flex-col justify-center p-8 lg:p-12">
          <div className="space-y-8">
            <div className="space-y-6 max-w-md">
              <h2 className="text-4xl font-bold text-foreground leading-tight">
                Welcome to VendShop
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-lg bg-primary/8 border border-primary/15">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Secure Transactions</h3>
                    <p className="text-sm text-muted-foreground">Your purchases are protected</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg bg-primary/8 border border-primary/15">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Instant Delivery</h3>
                    <p className="text-sm text-muted-foreground">Items delivered instantly</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg bg-primary/8 border border-primary/15">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Easy Wallet System</h3>
                    <p className="text-sm text-muted-foreground">Track all transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-background">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-3 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl font-bold text-center">
                VendShop
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-center">
                {isLogin 
                  ? "Enter your credentials to access your account" 
                  : "Enter your details to get started"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 sm:space-y-6">

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="name@example.com"
                              className="pl-10 text-sm"
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="password"
                              placeholder={isLogin ? "Enter your password" : "Create a password"}
                              className="pl-10 text-sm"
                              data-testid="input-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {!isLogin && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Must be at least 6 characters
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full mt-2 sm:mt-3"
                    size="lg"
                    disabled={isSubmitting}
                    data-testid="button-submit-auth"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">
                          {isLogin ? "Signing in..." : "Creating account..."}
                        </span>
                        <span className="sm:hidden text-xs">
                          {isLogin ? "Signing in..." : "Creating..."}
                        </span>
                      </>
                    ) : (
                      <>
                        {isLogin ? (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Sign In</span>
                            <span className="sm:hidden text-xs">Sign In</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Create Account</span>
                            <span className="sm:hidden text-xs">Create</span>
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {isLogin ? "New here?" : "Have account?"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full text-xs sm:text-sm"
                onClick={toggleMode}
                data-testid="button-toggle-auth-mode"
              >
                {isLogin ? "Create a new account" : "Sign in to existing account"}
              </Button>

              {isLogin && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs sm:text-sm text-primary hover:text-primary/80"
                  onClick={() => setShowForgotPassword(true)}
                  data-testid="button-forgot-password"
                >
                  Forgot password?
                </Button>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground px-2">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password
            </DialogDescription>
          </DialogHeader>

          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="name@example.com"
                        data-testid="input-forgot-password-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={forgotPasswordSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
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
