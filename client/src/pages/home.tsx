import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Product, Slide } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Package, ShoppingBag, ChevronLeft, ChevronRight, Search, Sliders } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: slides, isLoading: slidesLoading } = useQuery<Slide[]>({
    queryKey: ["/api/slides"],
  });

  // Filter to only active slides
  const activeSlides = slides?.filter(slide => slide.isActive) || [];

  // Get unique categories
  const categories = Array.from(new Set(products?.map(p => p.category) || [])).sort();

  // Filter products based on search and category, then sort by stock (highest first)
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.stockData.length - a.stockData.length) || [];

  useEffect(() => {
    if (!carouselApi) return;

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi || !activeSlides || activeSlides.length <= 1) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselApi, activeSlides]);

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Banner Slider */}
        {activeSlides.length > 0 ? (
          <div className="relative touch-pan-y" data-testid="banner-slider">
            <Carousel
              setApi={setCarouselApi}
              opts={{
                loop: true,
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent>
                {activeSlides.map((slide) => (
                  <CarouselItem key={slide.id} data-testid={`slide-${slide.id}`}>
                    <div className="relative aspect-[16/9] rounded-lg sm:rounded-2xl overflow-hidden shadow-sm sm:shadow-lg border border-border">
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h2 className="text-white font-bold text-2xl drop-shadow-lg">
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p className="text-white/95 text-sm drop-shadow-lg mt-2">
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.ctaLabel && slide.ctaHref && (
                          <a href={slide.ctaHref}>
                            <Button
                              size="sm"
                              className="mt-4"
                              data-testid={`slide-cta-${slide.id}`}
                            >
                              {slide.ctaLabel}
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            
            {/* Navigation Arrows */}
            {activeSlides.length > 1 && (
              <>
                <Button
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/40 hover:bg-black/60 text-white rounded-full shadow-lg"
                  onClick={() => carouselApi?.scrollPrev()}
                  data-testid="button-slide-prev"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/40 hover:bg-black/60 text-white rounded-full shadow-lg"
                  onClick={() => carouselApi?.scrollNext()}
                  data-testid="button-slide-next"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Dots Indicator */}
            {activeSlides.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {activeSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === current
                        ? "w-8 bg-secondary"
                        : "w-2 bg-muted-foreground/40"
                    }`}
                    onClick={() => carouselApi?.scrollTo(index)}
                    data-testid={`slide-dot-${index}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="bg-muted rounded-lg sm:rounded-xl p-3 sm:p-5 space-y-2 sm:space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-0.5">VendShop Marketplace</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Buy the highest quality items and accounts.</p>
          </div>

          <div className="flex gap-1.5 sm:gap-2 items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                data-testid="input-search"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0" data-testid="button-filters">
                  <Sliders className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {selectedCategories.length > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                      {selectedCategories.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                        }
                      }}
                      data-testid={`filter-category-${category}`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-5 pb-8">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="p-3 sm:p-4 flex items-center gap-3 shadow-sm">
                <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-16 flex-shrink-0" />
              </Card>
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} userBalance={user?.balance || 0} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Package className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No products found</h3>
              <p className="text-xs text-muted-foreground text-center">
                {searchQuery || selectedCategories.length > 0 ? "Try adjusting your filters" : "Check back soon!"}
              </p>
            </div>
          )}
        </div>
    </div>
  );
}
