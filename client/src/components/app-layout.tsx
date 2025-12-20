import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  ShoppingBag, 
  Wallet, 
  Package, 
  Shield, 
  LogOut, 
  Store,
  User,
  ExternalLink
} from "lucide-react";
import { SiDiscord } from "react-icons/si";
import currencyIcon from "@assets/IMG_2999_1765925106131.png";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { setOpenMobile } = useSidebar();

  const menuItems = [
    { title: "Shop", icon: ShoppingBag, href: "/" },
    { title: "Wallet", icon: Wallet, href: "/wallet" },
    { title: "Purchases", icon: Package, href: "/purchases" },
  ];

  if (user?.isAdmin) {
    menuItems.push({ title: "Admin", icon: Shield, href: "/admin" });
  }

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <Link href="/" className="flex items-center gap-3 group" onClick={handleNavClick}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-blue-600 flex items-center justify-center shadow-md">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">
              <div className="text-foreground">VendShop</div>
            </span>
            <span className="text-xs text-muted-foreground font-medium">Marketplace</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.href}
                    tooltip={item.title}
                    className="rounded-lg data-[active=true]:bg-primary/20 data-[active=true]:text-primary hover:bg-primary/10"
                  >
                    <Link 
                      href={item.href} 
                      data-testid={`nav-${item.title.toLowerCase()}`}
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Join Discord"
                >
                  <a 
                    href="https://discord.gg/Jmer3YdKzc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                    data-testid="nav-discord"
                  >
                    <SiDiscord className="h-5 w-5 text-[#5865F2]" />
                    <span>Discord</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <img src={currencyIcon} alt="" className="w-4 h-4" />
              {user?.balance.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [displayBalance, setDisplayBalance] = useState(user?.balance ?? 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousBalanceRef = useRef<number | null>(null);

  // Animate balance when it changes
  useEffect(() => {
    if (user?.balance !== undefined) {
      if (previousBalanceRef.current !== null && previousBalanceRef.current !== user.balance) {
        setIsAnimating(true);
        const startTime = Date.now();
        const duration = 600;
        const oldBalance = previousBalanceRef.current;
        const newBalance = user.balance;
        const difference = newBalance - oldBalance;

        const animateBalance = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setDisplayBalance(oldBalance + difference * progress);

          if (progress < 1) {
            requestAnimationFrame(animateBalance);
          } else {
            setDisplayBalance(newBalance);
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animateBalance);
      }
      previousBalanceRef.current = user.balance;
    }
  }, [user?.balance]);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/wallet">
                <Button 
                  variant="outline" 
                  className={`gap-2 transition-colors duration-200 ${isAnimating ? "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700" : ""}`}
                  data-testid="header-balance"
                >
                  <img src={currencyIcon} alt="" className="w-4 h-4" />
                  <span className={`font-semibold ${isAnimating ? "text-green-700 dark:text-green-300" : ""}`}>
                    {displayBalance.toFixed(2)}
                  </span>
                </Button>
              </Link>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-profile">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user?.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{user?.email}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Balance: <img src={currencyIcon} alt="" className="w-3 h-3 inline" /> {user?.balance.toFixed(2)}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/purchases" className="flex items-center gap-2 cursor-pointer">
                      <Package className="h-4 w-4" />
                      My Purchases
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-4 w-4" />
                      Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
            <footer className="border-t bg-background/50 p-4 sm:p-6 text-center text-xs sm:text-sm text-muted-foreground space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <p>All rights reserved. © 2025 VendShop</p>
              <a href="https://discord.gg/Jmer3YdKzc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-colors" data-testid="link-contact-us">
                Contact Us
              </a>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
