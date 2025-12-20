import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ShoppingCart, Package, AlertCircle, Ban, Minus, Plus, Wallet, Check } from "lucide-react";
import currencyIcon from "@assets/IMG_2999_1765925106131.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductCardProps {
  product: Product;
  userBalance: number;
}

export function ProductCard({ product, userBalance }: ProductCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const { refetchUser } = useAuth();
  
  const stockCount = product.stockData?.length || 0;
  const isOutOfStock = stockCount === 0;
  const isLowStock = stockCount > 0 && stockCount <= 3;
  const totalPrice = product.price * quantity;
  const canAfford = userBalance >= totalPrice;
  const maxQuantity = Math.min(stockCount, Math.floor(userBalance / product.price));

  const purchaseMutation = useMutation({
    mutationFn: async (qty: number) => {
      const response = await apiRequest("POST", `/api/products/${product.id}/purchase`, { quantity: qty });
      return response.json();
    },
    onSuccess: async (data) => {
      const purchasedQty = data.quantity || 1;
      const totalCost = product.price * purchasedQty;
      
      // Custom toast with product image
      const toastElement = document.createElement('div');
      toastElement.className = 'flex items-center gap-3';
      toastElement.innerHTML = `
        <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border">
          ${product.image ? `<img src="${product.image}" alt="" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center bg-primary/10"></div>'}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm">${product.name}</p>
          <p class="text-xs text-muted-foreground">-${totalCost.toFixed(2)}</p>
        </div>
      `;
      
      toast({
        title: "Purchase successful!",
        description: "Balance updated automatically",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      await refetchUser();
      setShowConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = () => {
    setQuantity(1);
    setShowConfirm(true);
  };

  const getStockIndicator = () => {
    if (isOutOfStock) {
      return (
        <div className="flex items-center gap-1.5 text-destructive">
          <Ban className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Sold Out</span>
        </div>
      );
    }
    if (isLowStock) {
      return (
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Only {stockCount} left</span>
        </div>
      );
    }
    if (stockCount > 0) {
      return (
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
          <Check className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">In Stock</span>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card 
        className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover-elevate transition-all border shadow-sm"
        data-testid={`card-product-${product.id}`}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-muted to-muted/50 border border-border/50 shadow-sm">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs sm:text-sm truncate text-foreground" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 line-clamp-1">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-2.5 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-secondary/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              <img src={currencyIcon} alt="" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="font-bold text-xs sm:text-sm text-secondary" data-testid={`text-product-price-${product.id}`}>
                {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-xs">
              {getStockIndicator()}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            disabled={isOutOfStock || userBalance < product.price || purchaseMutation.isPending}
            onClick={handleOpenDialog}
            className="gap-1"
            data-testid={`button-purchase-${product.id}`}
          >
            {purchaseMutation.isPending ? (
              <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 hidden sm:inline" />
                <span className="hidden sm:inline">Buy</span>
                <span className="sm:hidden">Buy</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-xs w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Complete Purchase
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review your order details below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
              <div className="w-14 h-14 rounded-lg bg-background flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{product.description}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <img src={currencyIcon} alt="" className="w-3 h-3" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per item
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-xs font-medium">Select Quantity</span>
                <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    data-testid="button-quantity-minus"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-xl w-8 text-center tabular-nums" data-testid="text-quantity">{quantity}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                    disabled={quantity >= maxQuantity}
                    data-testid="button-quantity-plus"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-right">
                {stockCount} available in stock
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Order Total</span>
                <span className="font-bold text-lg flex items-center gap-1.5 text-primary">
                  <img src={currencyIcon} alt="" className="w-4 h-4" />
                  {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  Your Balance
                </span>
                <span className="font-medium flex items-center gap-1">
                  <img src={currencyIcon} alt="" className="w-3 h-3" />
                  {userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1.5 border-t border-border/50">
                <span className="text-muted-foreground">Remaining After Purchase</span>
                <span className={`font-semibold flex items-center gap-1.5 ${!canAfford ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-500'}`}>
                  <img src={currencyIcon} alt="" className="w-3.5 h-3.5" />
                  {(userBalance - totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {!canAfford && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Insufficient balance for this purchase</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => purchaseMutation.mutate(quantity)}
              disabled={purchaseMutation.isPending || !canAfford}
              className="flex-1 gap-1"
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm Purchase
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
