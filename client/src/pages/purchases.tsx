import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Purchase } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ShoppingBag, 
  Package, 
  ChevronDown, 
  Copy, 
  Check,
  Eye,
  EyeOff,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import currencyIcon from "@assets/IMG_2999_1765925106131.png";

export default function PurchasesPage() {
  const { toast } = useToast();
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleStockIds, setVisibleStockIds] = useState<Set<string>>(new Set());
  const [showAllPurchases, setShowAllPurchases] = useState(false);

  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  // Group purchases by productId
  const groupedPurchases = purchases?.reduce((acc, purchase) => {
    const key = purchase.productId;
    if (!acc[key]) {
      acc[key] = {
        productId: purchase.productId,
        productName: purchase.productName,
        price: purchase.price,
        purchaseDate: purchase.purchaseDate,
        quantity: 0,
        items: [],
      };
    }
    acc[key].quantity += 1;
    acc[key].items.push(purchase);
    return acc;
  }, {} as Record<string, { productId: string; productName: string; price: number; purchaseDate: Date; quantity: number; items: Purchase[] }>) || {};

  const groupedList = Object.values(groupedPurchases).sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({
        title: "Copied!",
        description: "Stock data copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const toggleStockVisibility = (productId: string) => {
    setVisibleStockIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            My Purchases
          </h1>
          <p className="text-muted-foreground mt-2">
            View your purchase history and access your items
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <Skeleton className="h-4 sm:h-5 w-2/3 sm:w-1/3" />
                      <Skeleton className="h-3 sm:h-4 w-1/2 sm:w-1/4" />
                    </div>
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-24 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : purchases && purchases.length > 0 ? (
          <>
            <div className="space-y-3 sm:space-y-4">
              {groupedList
                .slice(0, showAllPurchases ? undefined : 7)
                .map((group) => (
                <Card key={group.productId} className="overflow-hidden" data-testid={`purchase-card-${group.productId}`}>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div className="p-3 sm:p-4 cursor-pointer hover-elevate transition-all">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-muted to-muted/50 border border-border/50 shadow-sm flex items-center justify-center">
                          <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/40" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm truncate text-foreground" data-testid={`text-purchase-name-${group.productId}`}>
                              {group.productName}
                            </h3>
                            {group.quantity > 1 && (
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-quantity-${group.productId}`}>
                                x{group.quantity}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{format(new Date(group.purchaseDate), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 bg-secondary/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full w-fit">
                            <img src={currencyIcon} alt="" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="font-bold text-xs sm:text-sm text-secondary" data-testid={`text-purchase-price-${group.productId}`}>
                              {(group.price * group.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStockVisibility(group.productId);
                            }}
                            data-testid={`button-toggle-visibility-${group.productId}`}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                          >
                            {visibleStockIds.has(group.productId) ? (
                              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              const allStockData = group.items.map(item => item.stockData).join('\n\n');
                              copyToClipboard(allStockData, group.productId);
                            }}
                            data-testid={`button-copy-${group.productId}`}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                          >
                            {copiedId === group.productId ? (
                              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200 ml-1" />
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t pt-3 sm:pt-4 space-y-2">
                      {group.items.map((item, index) => (
                        <div key={item.id} className="p-3 sm:p-4 rounded-lg bg-muted/50 space-y-2">
                          {group.quantity > 1 && (
                            <p className="text-xs font-medium text-muted-foreground">Item {index + 1}</p>
                          )}
                          <div className="font-mono text-xs sm:text-sm break-all">
                            {visibleStockIds.has(group.productId) ? (
                              item.stockData
                            ) : (
                              <span className="text-muted-foreground">
                                ••••••••••••••••••••
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
            </div>
            {groupedList.length > 7 && !showAllPurchases && (
              <div className="pt-2 sm:pt-3">
                <Button
                  onClick={() => setShowAllPurchases(true)}
                  variant="outline"
                  className="w-full"
                  data-testid="button-see-more-purchases"
                >
                  See More
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 sm:py-16 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No purchases yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                Browse our shop and make your first purchase!
              </p>
              <Button asChild>
                <a href="/">Browse Products</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
