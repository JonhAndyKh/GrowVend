import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import WalletPage from "@/pages/wallet";
import PurchasesPage from "@/pages/purchases";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/purchases" component={PurchasesPage} />
        <Route path="/admin">
          {user.isAdmin ? <AdminPage /> : <NotFound />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
