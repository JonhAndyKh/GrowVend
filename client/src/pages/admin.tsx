import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Product, User, Settings, Slide, Purchase, Transaction } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { 
  Shield, 
  Package, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Ban,
  Loader2,
  Check,
  Settings as SettingsIcon,
  Globe,
  Image,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  ArrowUpDown,
  Eye,
  EyeOff,
  ExternalLink,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import currencyIcon from "@assets/IMG_2999_1765925106131.png";

export default function AdminPage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  // Admin page header styling
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [addBalanceUser, setAddBalanceUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [depositWorld, setDepositWorld] = useState("");
  const [userSearch, setUserSearch] = useState("");
  
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [deletingSlide, setDeletingSlide] = useState<Slide | null>(null);
  
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    stockData: "",
    category: "general"
  });

  const [newSlide, setNewSlide] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    ctaLabel: "",
    ctaHref: "",
    order: 0,
    isActive: true
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: slides, isLoading: slidesLoading } = useQuery<Slide[]>({
    queryKey: ["/api/admin/slides"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/admin/purchases"],
  });

  // Initialize depositWorld from settings when loaded
  useEffect(() => {
    if (settings?.depositWorld) {
      setDepositWorld(settings.depositWorld);
    }
  }, [settings?.depositWorld]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (depositWorld: string) => {
      const response = await apiRequest("PATCH", "/api/admin/settings", { depositWorld });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Settings updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update settings", description: error.message, variant: "destructive" });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (product: typeof newProduct) => {
      const stockArray = product.stockData.split("\n").filter(s => s.trim());
      const response = await apiRequest("POST", "/api/admin/products", {
        name: product.name,
        description: product.description || null,
        price: parseFloat(product.price),
        image: product.image || null,
        stockData: stockArray,
        category: product.category
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Product added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowAddProduct(false);
      setNewProduct({ name: "", description: "", price: "", image: "", stockData: "", category: "general" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add product", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, product }: { id: string; product: typeof newProduct }) => {
      const stockArray = product.stockData.split("\n").filter(s => s.trim());
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, {
        name: product.name,
        description: product.description || null,
        price: parseFloat(product.price),
        image: product.image || null,
        stockData: stockArray,
        category: product.category
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Product deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDeletingProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete product", description: error.message, variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/ban`, { banned: ban });
      return response.json();
    },
    onSuccess: (_, { ban }) => {
      toast({ title: ban ? "User banned successfully" : "User unbanned successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/balance`, { amount });
      return response.json();
    },
    onSuccess: async (_, { userId }) => {
      toast({ title: "Balance added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      if (user?.id === userId) {
        await refetchUser();
      }
      setAddBalanceUser(null);
      setBalanceAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to add balance", description: error.message, variant: "destructive" });
    },
  });

  const addSlideMutation = useMutation({
    mutationFn: async (slide: typeof newSlide) => {
      const response = await apiRequest("POST", "/api/admin/slides", {
        title: slide.title,
        subtitle: slide.subtitle || null,
        imageUrl: slide.imageUrl,
        ctaLabel: slide.ctaLabel || null,
        ctaHref: slide.ctaHref || null,
        order: slide.order,
        isActive: slide.isActive
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Slide added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slides"] });
      setShowAddSlide(false);
      resetSlideForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to add slide", description: error.message, variant: "destructive" });
    },
  });

  const updateSlideMutation = useMutation({
    mutationFn: async ({ id, slide }: { id: string; slide: typeof newSlide }) => {
      const response = await apiRequest("PATCH", `/api/admin/slides/${id}`, {
        title: slide.title,
        subtitle: slide.subtitle || null,
        imageUrl: slide.imageUrl,
        ctaLabel: slide.ctaLabel || null,
        ctaHref: slide.ctaHref || null,
        order: slide.order,
        isActive: slide.isActive
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Slide updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slides"] });
      setEditingSlide(null);
      resetSlideForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update slide", description: error.message, variant: "destructive" });
    },
  });

  const deleteSlideMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/slides/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Slide deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slides"] });
      setDeletingSlide(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete slide", description: error.message, variant: "destructive" });
    },
  });

  const toggleSlideActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/slides/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slides"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update slide", description: error.message, variant: "destructive" });
    },
  });


  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      image: product.image || "",
      stockData: (product.stockData || []).join("\n"),
      category: product.category
    });
  };

  const openEditSlide = (slide: Slide) => {
    setEditingSlide(slide);
    setNewSlide({
      title: slide.title,
      subtitle: slide.subtitle || "",
      imageUrl: slide.imageUrl,
      ctaLabel: slide.ctaLabel || "",
      ctaHref: slide.ctaHref || "",
      order: slide.order,
      isActive: slide.isActive
    });
  };

  const resetSlideForm = () => {
    setNewSlide({
      title: "",
      subtitle: "",
      imageUrl: "",
      ctaLabel: "",
      ctaHref: "",
      order: 0,
      isActive: true
    });
  };

  const totalStock = products?.reduce((acc, p) => acc + (p.stockData?.length || 0), 0) || 0;
  const totalUsers = users?.length || 0;
  const totalProducts = products?.length || 0;
  const totalRevenue = purchases?.reduce((acc, p) => acc + p.price, 0) || 0;
  const activeSlides = slides?.filter(s => s.isActive).length || 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Manage your store, products, slides, and users
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="overview" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-overview">
              <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-products">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="slides" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-slides">
              <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Slides</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-users">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-settings">
              <SettingsIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-semibold">Dashboard Overview</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card data-testid="stat-total-users">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
                      <p className="text-xl sm:text-2xl font-bold">{totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-total-products">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Products</p>
                      <p className="text-xl sm:text-2xl font-bold">{totalProducts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-total-stock">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-orange-500/10">
                      <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total Stock</p>
                      <p className="text-xl sm:text-2xl font-bold">{totalStock}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-active-slides">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10">
                      <Image className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Active Slides</p>
                      <p className="text-xl sm:text-2xl font-bold">{activeSlides}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {purchasesLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : purchases && purchases.length > 0 ? (
                    <div className="space-y-3">
                      {purchases.slice(0, 5).map((purchase) => (
                        <div key={purchase.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`order-${purchase.id}`}>
                          <div>
                            <p className="font-medium text-sm">{purchase.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(purchase.purchaseDate), "MMM d, yyyy HH:mm")}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <img src={currencyIcon} alt="" className="w-3 h-3" />
                            {purchase.price.toFixed(2)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No orders yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`transaction-${tx.id}`}>
                          <div>
                            <p className="font-medium text-sm">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}
                            </p>
                          </div>
                          <Badge variant={tx.type === "deposit" || tx.type === "admin_credit" ? "default" : "secondary"} className="flex items-center gap-1">
                            {tx.type === "deposit" || tx.type === "admin_credit" ? "+" : "-"}
                            <img src={currencyIcon} alt="" className="w-3 h-3" />
                            {tx.amount.toFixed(2)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No transactions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
              <h2 className="text-lg sm:text-xl font-semibold">Products ({products?.length || 0})</h2>
              <Button onClick={() => setShowAddProduct(true)} size="sm" className="w-full sm:w-auto" data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {productsLoading ? (
              <div className="grid gap-3 sm:gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Skeleton className="h-14 w-14 sm:h-20 sm:w-20 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2 min-w-0">
                          <Skeleton className="h-4 sm:h-5 w-2/3 sm:w-1/3" />
                          <Skeleton className="h-3 sm:h-4 w-1/2 sm:w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid gap-3 sm:gap-4 pb-8">
                {products.map((product) => (
                  <Card key={product.id} data-testid={`admin-product-${product.id}`}>
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="h-6 w-6 sm:h-10 sm:w-10 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{product.name}</h3>
                              <Badge variant="secondary" className="text-xs flex-shrink-0">{product.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                              <span className="font-bold text-primary flex items-center gap-0.5 text-xs sm:text-sm">
                                <img src={currencyIcon} alt="" className="w-3 h-3" />
                                {product.price.toFixed(2)}
                              </span>
                              <Badge variant={product.stockData?.length ? "secondary" : "destructive"} className="text-xs">
                                {product.stockData?.length || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="outline" size="icon" onClick={() => openEditProduct(product)} data-testid={`button-edit-${product.id}`} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setDeletingProduct(product)} data-testid={`button-delete-${product.id}`} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No products yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first product to get started</p>
                  <Button onClick={() => setShowAddProduct(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Slides Tab */}
          <TabsContent value="slides" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
              <h2 className="text-lg sm:text-xl font-semibold">Slides ({slides?.length || 0})</h2>
              <Button onClick={() => setShowAddSlide(true)} size="sm" className="w-full sm:w-auto" data-testid="button-add-slide">
                <Plus className="h-4 w-4 mr-2" />
                Add Slide
              </Button>
            </div>

            {slidesLoading ? (
              <div className="grid gap-3 sm:gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Skeleton className="h-20 w-32 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2 min-w-0">
                          <Skeleton className="h-4 sm:h-5 w-2/3 sm:w-1/3" />
                          <Skeleton className="h-3 sm:h-4 w-1/2 sm:w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : slides && slides.length > 0 ? (
              <div className="grid gap-3 sm:gap-4 pb-8">
                {slides.map((slide) => (
                  <Card key={slide.id} data-testid={`admin-slide-${slide.id}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="w-24 h-16 sm:w-32 sm:h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {slide.imageUrl ? (
                            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                          ) : (
                            <Image className="h-7 w-7 sm:h-10 sm:w-10 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base">{slide.title}</h3>
                            <Badge variant={slide.isActive ? "default" : "secondary"} className="text-xs">
                              {slide.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Order: {slide.order}
                            </Badge>
                          </div>
                          {slide.subtitle && (
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{slide.subtitle}</p>
                          )}
                          {slide.ctaLabel && slide.ctaHref && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                              <ExternalLink className="h-3 w-3" />
                              {slide.ctaLabel}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={slide.isActive}
                              onCheckedChange={(checked) => toggleSlideActiveMutation.mutate({ id: slide.id, isActive: checked })}
                              data-testid={`switch-active-${slide.id}`}
                            />
                          </div>
                          <Button variant="outline" size="icon" onClick={() => openEditSlide(slide)} data-testid={`button-edit-slide-${slide.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setDeletingSlide(slide)} data-testid={`button-delete-slide-${slide.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No slides yet</h3>
                  <p className="text-muted-foreground mb-4">Add slides to display on your store homepage</p>
                  <Button onClick={() => setShowAddSlide(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slide
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold">Users ({users?.length || 0})</h2>
              <Input
                placeholder="Search by email or GrowID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full sm:w-64"
                data-testid="input-user-search"
              />
            </div>

            {usersLoading ? (
              <div className="grid gap-3 sm:gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2 min-w-0">
                          <Skeleton className="h-4 sm:h-5 w-2/3 sm:w-1/3" />
                          <Skeleton className="h-3 sm:h-4 w-1/2 sm:w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="grid gap-3 sm:gap-4 pb-8">
                {users.filter(user => {
                  const searchTerm = userSearch.toLowerCase();
                  return user.email.toLowerCase().includes(searchTerm) || 
                         (user.growId && user.growId.toLowerCase().includes(searchTerm));
                }).map((user) => (
                  <Card key={user.id} data-testid={`admin-user-${user.id}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-sm sm:text-base flex-shrink-0">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate text-sm sm:text-base">{user.email}</h3>
                              {user.isAdmin && <Badge variant="default" className="text-xs">Admin</Badge>}
                              {user.isBanned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                            </div>
                            <div className="flex flex-col gap-1 sm:gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1">Balance: <img src={currencyIcon} alt="" className="w-3 h-3" /><span className="font-semibold text-foreground">{user.balance.toFixed(2)}</span></span>
                              </div>
                              {user.growId && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">GrowID:</span>
                                  <span className="font-semibold text-foreground" data-testid={`text-growid-${user.id}`}>{user.growId}</span>
                                </div>
                              )}
                              <span className="hidden sm:inline">Joined: {format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
                          <Button variant="outline" size="sm" onClick={() => setAddBalanceUser(user)} data-testid={`button-add-balance-${user.id}`}>
                            <img src={currencyIcon} alt="" className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Add Balance</span>
                          </Button>
                          {!user.isAdmin && (
                            <Button
                              variant={user.isBanned ? "default" : "outline"}
                              size="sm"
                              onClick={() => banUserMutation.mutate({ userId: user.id, ban: !user.isBanned })}
                              disabled={banUserMutation.isPending}
                              data-testid={`button-ban-${user.id}`}
                            >
                              {user.isBanned ? (
                                <>
                                  <Check className="h-4 w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Unban</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Ban</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold">No users yet</h3>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-semibold">Settings</h2>

            {settingsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card data-testid="card-settings">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Deposit World
                  </CardTitle>
                  <CardDescription>
                    Set the world name where users will deposit funds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">World Name</label>
                    <Input
                      value={depositWorld}
                      onChange={(e) => setDepositWorld(e.target.value)}
                      placeholder="Enter deposit world name"
                      data-testid="input-deposit-world"
                    />
                    <p className="text-xs text-muted-foreground">
                      This world name will be displayed to users on their wallet page
                    </p>
                  </div>

                  {settings?.depositWorld && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-semibold text-primary">{settings.depositWorld}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => updateSettingsMutation.mutate(depositWorld || settings?.depositWorld || "")}
                    disabled={(!depositWorld && !settings?.depositWorld) || updateSettingsMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddProduct || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setShowAddProduct(false);
          setEditingProduct(null);
          setNewProduct({ name: "", description: "", price: "", image: "", stockData: "", category: "general" });
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the product details" : "Fill in the product details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Product name"
                data-testid="input-product-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Product description"
                rows={2}
                data-testid="input-product-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price *</label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  data-testid="input-product-price"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="general"
                  data-testid="input-product-category"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                placeholder="https://example.com/image.png"
                data-testid="input-product-image"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Data (one per line)</label>
              <Textarea
                value={newProduct.stockData}
                onChange={(e) => setNewProduct({ ...newProduct, stockData: e.target.value })}
                placeholder="account1:password1&#10;account2:password2&#10;license-key-123"
                rows={4}
                className="font-mono text-sm"
                data-testid="input-product-stock"
              />
              <p className="text-xs text-muted-foreground">
                Enter each stock item on a new line. These will be given to customers upon purchase.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddProduct(false);
              setEditingProduct(null);
              setNewProduct({ name: "", description: "", price: "", image: "", stockData: "", category: "general" });
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingProduct) {
                  updateProductMutation.mutate({ id: editingProduct.id, product: newProduct });
                } else {
                  addProductMutation.mutate(newProduct);
                }
              }}
              disabled={!newProduct.name || !newProduct.price || addProductMutation.isPending || updateProductMutation.isPending}
              data-testid="button-save-product"
            >
              {(addProductMutation.isPending || updateProductMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingProduct ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Slide Dialog */}
      <Dialog open={showAddSlide || !!editingSlide} onOpenChange={(open) => {
        if (!open) {
          setShowAddSlide(false);
          setEditingSlide(null);
          resetSlideForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlide ? "Edit Slide" : "Add New Slide"}</DialogTitle>
            <DialogDescription>
              {editingSlide ? "Update the slide details" : "Create a new slide for your store homepage"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={newSlide.title}
                onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                placeholder="Slide title"
                data-testid="input-slide-title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subtitle</label>
              <Input
                value={newSlide.subtitle}
                onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
                placeholder="Optional subtitle"
                data-testid="input-slide-subtitle"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL *</label>
              <Input
                value={newSlide.imageUrl}
                onChange={(e) => setNewSlide({ ...newSlide, imageUrl: e.target.value })}
                placeholder="https://example.com/banner.png"
                data-testid="input-slide-image"
              />
            </div>

            {newSlide.imageUrl && (
              <div className="rounded-lg overflow-hidden border bg-muted/50 aspect-video">
                <img 
                  src={newSlide.imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Button Label</label>
                <Input
                  value={newSlide.ctaLabel}
                  onChange={(e) => setNewSlide({ ...newSlide, ctaLabel: e.target.value })}
                  placeholder="Shop Now"
                  data-testid="input-slide-cta-label"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Button Link</label>
                <Input
                  value={newSlide.ctaHref}
                  onChange={(e) => setNewSlide({ ...newSlide, ctaHref: e.target.value })}
                  placeholder="/products"
                  data-testid="input-slide-cta-href"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Order</label>
                <Input
                  type="number"
                  value={newSlide.order}
                  onChange={(e) => setNewSlide({ ...newSlide, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  data-testid="input-slide-order"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={newSlide.isActive}
                    onCheckedChange={(checked) => setNewSlide({ ...newSlide, isActive: checked })}
                    data-testid="switch-slide-active"
                  />
                  <span className="text-sm">{newSlide.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddSlide(false);
              setEditingSlide(null);
              resetSlideForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingSlide) {
                  updateSlideMutation.mutate({ id: editingSlide.id, slide: newSlide });
                } else {
                  addSlideMutation.mutate(newSlide);
                }
              }}
              disabled={!newSlide.title || !newSlide.imageUrl || addSlideMutation.isPending || updateSlideMutation.isPending}
              data-testid="button-save-slide"
            >
              {(addSlideMutation.isPending || updateSlideMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingSlide ? (
                "Update Slide"
              ) : (
                "Add Slide"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Slide Confirmation */}
      <AlertDialog open={!!deletingSlide} onOpenChange={() => setDeletingSlide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the slide "{deletingSlide?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSlide && deleteSlideMutation.mutate(deletingSlide.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSlideMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Balance Dialog */}
      <Dialog open={!!addBalanceUser} onOpenChange={() => {
        setAddBalanceUser(null);
        setBalanceAmount("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Balance</DialogTitle>
            <DialogDescription>
              Add funds to {addBalanceUser?.email}'s wallet
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-semibold flex items-center gap-1">
                  <img src={currencyIcon} alt="" className="w-4 h-4" />
                  {addBalanceUser?.balance.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Add</label>
              <div className="relative">
                <img src={currencyIcon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <Input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                  min="0.01"
                  step="0.01"
                  data-testid="input-admin-balance"
                />
              </div>
            </div>

            {balanceAmount && parseFloat(balanceAmount) > 0 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between font-semibold">
                  <span>New Balance:</span>
                  <span className="text-primary flex items-center gap-1">
                    <img src={currencyIcon} alt="" className="w-4 h-4" />
                    {((addBalanceUser?.balance || 0) + parseFloat(balanceAmount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setAddBalanceUser(null);
              setBalanceAmount("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => addBalanceUser && addBalanceMutation.mutate({ 
                userId: addBalanceUser.id, 
                amount: parseFloat(balanceAmount) 
              })}
              disabled={!balanceAmount || parseFloat(balanceAmount) <= 0 || addBalanceMutation.isPending}
              data-testid="button-confirm-add-balance"
            >
              {addBalanceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add <img src={currencyIcon} alt="" className="w-4 h-4 inline mx-1" />{balanceAmount || "0"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
