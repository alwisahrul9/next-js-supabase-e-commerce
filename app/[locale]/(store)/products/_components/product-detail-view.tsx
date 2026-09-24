"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";;
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Store,
  MapPin,
  Warehouse as WarehouseIcon,
  ShieldCheck,
  Plus,
  Minus,
  Share2,
  Star,
  User,
  X,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useCartStore } from "@/app/hooks/use-cart";
import { toast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

interface StockWithWarehouse {
  id: string;
  qty: number;
  size: string;
  warehouse: {
    id: string;
    warehouseName: string;
    city: string;
    province: string;
    isMain: boolean;
  };
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    weight: number | null;
    images: string[];
    isFeatured: boolean;
    status: string;
    category?: { id: string; name: string } | null;
    storeProfile?: {
      id: string;
      storeName: string;
      storeDescription?: string | null;
      logoUrl?: string | null;
    } | null;
    stocks?: StockWithWarehouse[];
    productReviews?: Array<{
      id: string;
      rating: number;
      message: string | null;
      images: string[];
      createdAt: Date;
      user: {
        name: string | null;
      };
    }>;
  };
}

export default function ProductDetailView({ product }: ProductDetailProps) {
    const locale = useLocale();
  const { data: session } = useSession();
  const t = useTranslations("ProductDetail");
  const tAlerts = useTranslations("Alerts");
  const router = useRouter();

  const isSellerOrEmployee = (session?.user as any)?.role === "SELLER" || (session?.user as any)?.role === "EMPLOYEE";

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518"];
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoadingCart, setIsLoadingCart] = useState(false); 

  const availableSizes = Array.from(new Set((product.stocks || []).map(s => s.size))).filter(Boolean);
  const defaultSize = availableSizes.includes("ALL") ? "ALL" : (availableSizes.length > 0 ? availableSizes[0] : "ALL");
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize);

  const totalStock = (product.stocks || [])
    .filter(s => s.size === selectedSize)
    .reduce((acc, curr) => acc + (curr.qty || 0), 0); 
  const isOutOfStock = totalStock <= 0; 
  
  const addToCartStore = useCartStore((state) => state.addToCart);

  const handleAddToCart = async () => { 
    setIsLoadingCart(true); 
    try { 
      const res = await addToCartStore(product.id, quantity, selectedSize); 
      if (res.success) { 
        toast.add({ title: tAlerts("addToCartSuccess"), description: tAlerts("addToCartDesc", { quantity, productName: product.name }), }); 
      } else { 
        toast.add({ title: tAlerts("attention"), description: res.msg || tAlerts("loginToCart"), }); 
      } 
    } catch (error) { 
      toast.add({ title: tAlerts("failed"), description: tAlerts("addToCartError"), }); 
    } finally { 
      setIsLoadingCart(false); 
    } 
  }; 
  
  const handleBuyNow = () => { 
    router.push(`/checkout?productId=${product.id}&quantity=${quantity}&size=${encodeURIComponent(selectedSize)}`); 
  }; 
  
  const censorName = (name: string | null | undefined) => {
    if (!name) return "A***n";
    if (name.length <= 2) return name[0] + "***";
    const firstChar = name[0];
    const lastChar = name[name.length - 1];
    return `${firstChar}***${lastChar}`;
  };

  return ( 
    <div className="space-y-12 pb-24 bg-white text-zinc-900 font-sans min-h-screen"> 
      {/* Top Navigation & Breadcrumbs */} 
      <div className="flex items-center justify-between px-4 lg:px-8 pt-8"> 
        <Link href={`/${locale}/products`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors" > 
          <ArrowLeft className="h-4 w-4" /> 
          <span>{t("backToProducts")}</span> 
        </Link> 
        
        {/* Share Button */} 
        <button 
          onClick={() => { 
            if (navigator.share) { 
              navigator.share({ title: product.name, url: window.location.href, }); 
            } else { 
              navigator.clipboard.writeText(`${window.location.origin}/products/${product.slug}`).then(() => {
                toast.add({ title: tAlerts("linkCopied"), description: tAlerts("linkCopiedDesc") }); 
              });
            } 
          }} 
          className="p-2.5 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors" 
          title={t("shareProduct")} 
        > 
          <Share2 className="h-4 w-4" /> 
        </button> 
      </div> 

      {/* Main Detail Grid */} 
      <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start"> 
        
        {/* LEFT COLUMN: Gallery View (6 cols on lg) */} 
        <div className="lg:col-span-6 space-y-4"> 
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100"> 
            <Image 
              src={selectedImage} 
              alt={product.name} 
              fill 
              priority 
              className="object-cover" 
              sizes="(max-width: 1024px) 100vw, 50vw" 
            /> 
            {product.isFeatured && ( 
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold bg-white text-zinc-900 uppercase tracking-widest shadow-sm"> 
                FEATURED 
              </span> 
            )} 
            <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${ !isOutOfStock ? "bg-zinc-900" : "bg-red-500" }`} > 
              {!isOutOfStock ? t("stockAvailable", { count: totalStock }) : t("outOfStock")} 
            </span> 
          </div> 
          
          {/* Thumbnails list */} 
          {images.length > 1 && ( 
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none"> 
              {images.map((imgUrl, idx) => { 
                const isSelected = selectedImage === imgUrl; 
                return ( 
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(imgUrl)} 
                    className={`relative h-20 w-20 rounded-xl overflow-hidden transition-all flex-shrink-0 ${ isSelected ? "ring-2 ring-zinc-900 ring-offset-2 opacity-100" : "opacity-60 hover:opacity-100 bg-zinc-100" }`} 
                  > 
                    <Image src={imgUrl} alt={`${product.name} ${idx + 1}`} fill className="object-cover" /> 
                  </button> 
                ); 
              })} 
            </div> 
          )} 
        </div> 
        
        {/* RIGHT COLUMN: Product Information & Purchase Form (6 cols on lg) */} 
        <div className="lg:col-span-6 space-y-10"> 
          {/* Header Info */} 
          <div className="space-y-4"> 
            <div className="flex flex-wrap items-center gap-2"> 
              <span className="text-xs font-medium tracking-widest uppercase text-zinc-400"> 
                {product.category?.name || t("uncategorized")} 
              </span>
              {product.weight && ( 
                <>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs font-medium text-zinc-500"> 
                    {product.weight} {t("grams")} 
                  </span> 
                </>
              )} 
            </div> 
            
            <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight leading-[1.1]"> 
              {product.name} 
            </h1> 
            
            <div className="pt-2"> 
              <span className="text-2xl sm:text-3xl font-medium text-zinc-900"> 
                {formatCurrency(product.price)} 
              </span> 
            </div> 
          </div> 
          
          {/* Size Selector */}
          {!isSellerOrEmployee && availableSizes.length > 0 && availableSizes[0] !== "ALL" && (
            <div className="space-y-4">
              <span className="text-sm font-medium text-zinc-600">Pilih Ukuran / Varian</span>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => {
                  const sizeStock = (product.stocks || []).filter(s => s.size === size).reduce((acc, curr) => acc + (curr.qty || 0), 0);
                  const isSizeOutOfStock = sizeStock <= 0;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1); // Reset quantity when changing size
                      }}
                      disabled={isSizeOutOfStock}
                      className={`px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : isSizeOutOfStock
                          ? "bg-zinc-50 text-zinc-400 border-zinc-200 cursor-not-allowed line-through opacity-60"
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Action Buttons */} 
          {!isSellerOrEmployee && (
            <div className="space-y-6"> 
              <div className="flex items-center gap-4"> 
                <span className="text-sm font-medium text-zinc-600"> 
                  {t("selectQuantity")} 
                </span> 
                <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-full p-1"> 
                  <button 
                    disabled={quantity <= 1 || isOutOfStock} 
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))} 
                    className="p-2 rounded-full hover:bg-white text-zinc-700 disabled:opacity-30 transition-colors" 
                  > 
                    <Minus className="h-4 w-4" /> 
                  </button> 
                  <span className="w-12 text-center text-sm font-semibold text-zinc-900"> 
                    {quantity} 
                  </span> 
                  <button 
                    disabled={quantity >= totalStock || isOutOfStock} 
                    onClick={() => setQuantity((q) => Math.min(totalStock, q + 1))} 
                    className="p-2 rounded-full hover:bg-white text-zinc-700 disabled:opacity-30 transition-colors" 
                  > 
                    <Plus className="h-4 w-4" /> 
                  </button> 
                </div> 
                <span className="text-sm text-zinc-500">
                  {totalStock > 0 ? t("stockRemaining", { count: totalStock }) : t("outOfStock")}
                </span>
              </div> 
              
              {/* Main CTA Buttons */} 
              <div className="flex flex-col sm:flex-row gap-3"> 
                <button 
                  disabled={isOutOfStock || isLoadingCart} 
                  onClick={handleAddToCart} 
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full text-sm font-semibold border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 disabled:opacity-50 transition-colors" 
                > 
                  <ShoppingCart className="h-4 w-4" /> 
                  <span>{isLoadingCart ? t("processing") : t("addToCart")}</span> 
                </button> 
                <button 
                  disabled={isOutOfStock} 
                  onClick={handleBuyNow} 
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 transition-colors" 
                > 
                  <Zap className="h-4 w-4" /> 
                  <span>{t("buyNow")}</span> 
                </button> 
              </div> 
            </div> 
          )}
          
          <div className="w-full h-px bg-zinc-100" />

          {/* Description Section */} 
          <div className="space-y-4"> 
            <h3 className="text-base font-semibold text-zinc-900"> 
              {t("productDescription")} 
            </h3> 
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line font-light"> 
              {product.description} 
            </p> 
          </div> 
          
          {/* Store & Multi-Warehouse Stock Section */} 
          <div className="bg-zinc-50 rounded-2xl p-6 space-y-6"> 
            <div className="flex items-center gap-4"> 
              <div className="h-12 w-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0"> 
                {product.storeProfile?.logoUrl ? ( 
                  <Image src={product.storeProfile.logoUrl} alt={product.storeProfile.storeName} width={48} height={48} className="object-cover w-full h-full" /> 
                ) : ( 
                  <Store className="h-5 w-5 text-zinc-400" /> 
                )} 
              </div> 
              <div> 
                <h4 className="font-semibold text-sm text-zinc-900 flex items-center gap-1.5"> 
                  {product.storeProfile?.storeName || "Toko Official"} 
                  <ShieldCheck className="h-4 w-4 text-zinc-400 inline" /> 
                </h4> 
                <p className="text-xs text-zinc-500 mt-0.5"> 
                  {t("officialSellerMultiWarehouse")} 
                </p> 
              </div> 
            </div> 
            
            {/* Warehouse Stock List Breakdown */} 
            {product.stocks && product.stocks.length > 0 && ( 
              <div className="pt-4 border-t border-zinc-200/60 space-y-3"> 
                <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5"> 
                  <WarehouseIcon className="h-4 w-4 text-zinc-400" /> {t("stockBreakdown")}: 
                </span> 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> 
                  {product.stocks.filter(s => s.size === selectedSize).map((stk) => ( 
                    <div key={stk.id + stk.size} className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-100" > 
                      <div className="flex items-center gap-2 text-zinc-600"> 
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" /> 
                        <span className="text-xs font-medium truncate max-w-[100px]"> 
                          {stk.warehouse?.warehouseName || "Gudang"} 
                        </span> 
                      </div> 
                      <span className="text-xs font-semibold text-zinc-900 bg-zinc-50 px-2.5 py-1 rounded-md"> 
                        {stk.qty} {t("units")} 
                      </span> 
                    </div> 
                  ))} 
                </div> 
              </div> 
            )} 
          </div> 
        </div> 
      </div> 

      {/* Reviews Section */}
      {product.productReviews && product.productReviews.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-16 pt-12 border-t border-zinc-100">
          <h3 className="text-2xl font-bold text-zinc-900 mb-8">Ulasan Produk</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.productReviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">
                        {censorName(review.user.name)}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {new Date(review.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-zinc-100 text-zinc-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.message && (
                  <p className="text-sm text-zinc-700 leading-relaxed font-light">
                    {review.message}
                  </p>
                )}

                {review.images && review.images.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none pt-2">
                    {review.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setZoomedImage(img)}
                        className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 border border-zinc-100 hover:ring-2 hover:ring-zinc-900 transition-all cursor-zoom-in"
                      >
                        <Image src={img} alt="Review image" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] aspect-square md:aspect-video rounded-xl overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <Image 
              src={zoomedImage} 
              alt="Zoomed Review Image" 
              fill 
              className="object-contain" 
            />
          </div>
        </div>
      )}
    </div> 
  );
}
