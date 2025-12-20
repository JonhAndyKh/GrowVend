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
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2 font-bold">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Complete Purchase
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Review and confirm your order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Product Section */}
            <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-base leading-snug">{product.name}</p>
                  {product.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{product.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2.5 bg-secondary/10 w-fit px-3 py-1.5 rounded-full">
                    <img src={currencyIcon} alt="" className="w-3.5 h-3.5" />
                    <span className="text-sm font-semibold text-secondary">
                      {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold block">Select Quantity</label>
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="h-9 w-9"
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
                    className="h-9 w-9"
                    data-testid="button-quantity-plus"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stockCount} available
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-muted-foreground">Subtotal</span>
                <span className="font-bold text-base flex items-center gap-1.5">
                  <img src={currencyIcon} alt="" className="w-4 h-4" />
                  {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-primary/20 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Order Total</span>
                  <span className="font-bold text-lg text-primary flex items-center gap-1.5">
                    <img src={currencyIcon} alt="" className="w-4 h-4" />
                    {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="rounded-lg bg-muted/40 p-4 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Current Balance
                </span>
                <span className="font-semibold flex items-center gap-1">
                  <img src={currencyIcon} alt="" className="w-3.5 h-3.5" />
                  {userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-border/50 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">After Purchase</span>
                  <span className={`font-bold flex items-center gap-1.5 text-base ${!canAfford ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-500'}`}>
                    <img src={currencyIcon} alt="" className="w-3.5 h-3.5" />
                    {(userBalance - totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {!canAfford && (
              <div className="flex items-center gap-3 text-sm bg-destructive/10 text-destructive rounded-lg p-4 border border-destructive/20">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Insufficient balance for this purchase</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => purchaseMutation.mutate(quantity)}
              disabled={purchaseMutation.isPending || !canAfford}
              className="flex-1 gap-2"
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing
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
