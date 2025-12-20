import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Transaction, Settings } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Loader2,
  User,
  Globe,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import currencyIcon from "@assets/IMG_2999_1765925106131.png";

export default function WalletPage() {
  const { user, refetchUser } = useAuth();
  const [showSetGrowId, setShowSetGrowId] = useState(false);
  const [growId, setGrowId] = useState("");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const setGrowIdMutation = useMutation({
    mutationFn: async (growId: string) => {
      const response = await apiRequest("POST", "/api/wallet/growid", { growId });
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "GrowID set successfully!",
        description: `Your GrowID has been updated.`,
      });
      await refetchUser();
      setShowSetGrowId(false);
      setGrowId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to set GrowID",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "topup":
      case "admin_add":
      case "discord_deposit":
        return <ArrowDownLeft className="h-5 w-5 text-secondary" />;
      case "purchase":
        return <ArrowUpRight className="h-5 w-5 text-destructive" />;
      case "refund":
        return <ArrowDownLeft className="h-5 w-5 text-secondary" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "topup":
      case "admin_add":
      case "discord_deposit":
      case "refund":
        return "text-secondary";
      case "purchase":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  const openSetGrowIdDialog = () => {
    setGrowId(user?.growId || "");
    setShowSetGrowId(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-primary/15 via-primary/5 to-background border border-primary/20 shadow-lg hover-elevate transition-all duration-300">
          <CardHeader className="pb-3 sm:pb-4">
            <CardDescription className="text-sm font-medium">Available Balance</CardDescription>
            <CardTitle className="text-3xl sm:text-4xl font-bold flex items-center gap-2 sm:gap-3 transition-transform duration-500 ease-out">
              <img src={currencyIcon} alt="" className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300" />
              <span className="text-foreground transition-colors duration-300">
                {user?.balance.toFixed(2) || "0.00"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">GrowID:</span>
                {user?.growId ? (
                  <>
                    <span className="font-semibold" data-testid="text-growid">{user.growId}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={openSetGrowIdDialog}
                      data-testid="button-edit-growid"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </div>
              
              {settings?.depositWorld && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Deposit World:</span>
                  <span className="font-semibold text-primary" data-testid="text-deposit-world">{settings.depositWorld}</span>
                </div>
              )}
            </div>

            {!user?.growId && (
              <Button onClick={openSetGrowIdDialog} className="gap-2" data-testid="button-set-growid">
                <User className="h-4 w-4" />
                Set GrowID
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              Transaction History
            </CardTitle>
            <CardDescription className="text-sm">Your recent wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4">
                    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <Skeleton className="h-4 w-3/4 sm:w-1/2" />
                      <Skeleton className="h-3 w-1/2 sm:w-1/4" />
                    </div>
                    <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <>
                <div className="space-y-2 sm:space-y-3">
                  {transactions
                    .slice(0, showAllTransactions ? undefined : 7)
                    .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/30 hover-elevate transition-all"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background flex items-center justify-center border flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm sm:text-base">{transaction.description}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(transaction.createdAt), "MMM d, yyyy • h:mm a")}
                        </p>
                      </div>
                      <div className={`font-semibold flex items-center gap-1 text-sm sm:text-base flex-shrink-0 ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === "purchase" ? "-" : "+"}
                        <img src={currencyIcon} alt="" className="w-3 h-3 sm:w-4 sm:h-4 inline" />
                        {Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                {transactions.length > 7 && !showAllTransactions && (
                  <div className="pt-2 sm:pt-3">
                    <Button
                      onClick={() => setShowAllTransactions(true)}
                      variant="outline"
                      className="w-full"
                      data-testid="button-see-more-transactions"
                    >
                      See More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 sm:py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">No transactions yet</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Your transaction history will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSetGrowId} onOpenChange={setShowSetGrowId}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {user?.growId ? "Edit GrowID" : "Set GrowID"}
            </DialogTitle>
            <DialogDescription>
              Enter your GrowID for deposits. This is your username in the game. Each GrowID can only be used by one account.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">GrowID (Username)</label>
              <Input
                type="text"
                value={growId}
                onChange={(e) => setGrowId(e.target.value)}
                placeholder="Enter your GrowID"
                maxLength={20}
                data-testid="input-growid"
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, and underscores allowed. 3-20 characters.
              </p>
            </div>

            {settings?.depositWorld && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Deposit World</span>
                </div>
                <p className="text-lg font-bold text-primary" data-testid="dialog-deposit-world">{settings.depositWorld}</p>
                <p className="text-xs text-muted-foreground">
                  Visit this world in-game to make deposits
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSetGrowId(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setGrowIdMutation.mutate(growId)}
              disabled={!growId || growId.length < 3 || setGrowIdMutation.isPending}
              data-testid="button-confirm-growid"
            >
              {setGrowIdMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save GrowID"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
