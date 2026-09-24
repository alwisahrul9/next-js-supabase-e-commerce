"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Archive,
  Lock,
  Toolbox,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
  status: string;
  isFeatured: boolean;
}

export default function ProductImageCarousel({
  images,
  productName,
  status,
  isFeatured,
}: ProductImageCarouselProps) {
  const t = useTranslations("SellerProductDetail");

  // Clean empty strings or nulls from images array
  const cleanImages = (images || []).filter((img) => img && img.trim() !== "");
  const hasImages = cleanImages.length > 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleNext = useCallback(() => {
    if (!hasImages) return;
    setCurrentIndex((prev) => (prev + 1) % cleanImages.length);
  }, [cleanImages.length, hasImages]);

  const handlePrev = useCallback(() => {
    if (!hasImages) return;
    setCurrentIndex((prev) =>
      prev === 0 ? cleanImages.length - 1 : prev - 1
    );
  }, [cleanImages.length, hasImages]);

  // Keyboard navigation for lightbox & carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape" && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, isLightboxOpen]);

  // Prevent scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLightboxOpen]);

  // Status Badge config
  const statusConfig: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
    ACTIVE: {
      label: "ACTIVE",
      style: "bg-emerald-500/90 text-white border-emerald-400/30",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    DRAFT: {
      label: "DRAFT",
      style: "bg-zinc-500/90 text-white border-zinc-400/30",
      icon: <Toolbox className="h-3.5 w-3.5" />,
    },
    ARCHIVED: {
      label: "ARCHIVED",
      style: "bg-amber-500/90 text-white border-amber-400/30",
      icon: <Archive className="h-3.5 w-3.5" />,
    },
    BLOCKED: {
      label: "BLOCKED",
      style: "bg-rose-500/90 text-white border-rose-400/30",
      icon: <Lock className="h-3.5 w-3.5" />,
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.DRAFT;

  if (!hasImages) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-4/3 sm:aspect-1/1 w-full rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex flex-col items-center justify-center p-6 text-center shadow-xs">
          {/* Overlay Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border backdrop-blur-md shadow-xs ${currentStatus.style}`}
            >
              {currentStatus.icon}
              {currentStatus.label}
            </span>
            {isFeatured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-500 text-white shadow-md tracking-wider">
                <Star className="h-3.5 w-3.5 fill-white" />
                FEATURED
              </span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-zinc-200/70 dark:bg-zinc-700/50 mb-3 text-zinc-400 dark:text-zinc-500">
            <ImageIcon className="h-10 w-10 stroke-[1.5]" />
          </div>
          <h4 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
            {t("noImages")}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
            {t("noImagesSub")}
          </p>
        </div>
      </div>
    );
  }

  const currentImgUrl = cleanImages[currentIndex];

  return (
    <div className="space-y-4">
      {/* MAIN CAROUSEL VIEWPORT */}
      <div className="relative aspect-4/3 sm:aspect-1/1 w-full rounded-3xl overflow-hidden bg-zinc-950/5 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-md group">
        {/* Active Image */}
        <Image
          src={currentImgUrl}
          alt={`${productName} - ${currentIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          className="object-cover transition-all duration-500 ease-out cursor-pointer hover:scale-105"
          onClick={() => setIsLightboxOpen(true)}
        />

        {/* Top Badges & Image Counter Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border backdrop-blur-md shadow-md ${currentStatus.style}`}
            >
              {currentStatus.icon}
              {currentStatus.label}
            </span>
            {isFeatured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-500 text-white shadow-md tracking-wider">
                <Star className="h-3.5 w-3.5 fill-white" />
                FEATURED
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-md">
              {currentIndex + 1} / {cleanImages.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="p-2 rounded-xl bg-black/60 text-white backdrop-blur-md border border-white/10 hover:bg-black/80 transition-all shadow-md active:scale-95 cursor-pointer"
              title={t("zoom")}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Previous Button */}
        {cleanImages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-900 dark:text-white border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 active:scale-95 z-10 cursor-pointer"
            aria-label="Previous Image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Next Button */}
        {cleanImages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-900 dark:text-white border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 active:scale-95 z-10 cursor-pointer"
            aria-label="Next Image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Bottom Slide Progress Dots */}
        {cleanImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 z-10">
            {cleanImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "w-6 bg-orange-500"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* THUMBNAILS GALLERY CONTAINER */}
      {cleanImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
          {cleanImages.map((imgUrl, idx) => {
            const isSelected = currentIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 cursor-pointer ${
                  isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/30 scale-105 shadow-md"
                    : "border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between z-10 text-white">
            <div>
              <h3 className="font-bold text-base sm:text-lg line-clamp-1">
                {productName}
              </h3>
              <p className="text-xs text-zinc-400">
                {t("imageCounter", {
                  current: currentIndex + 1,
                  total: cleanImages.length,
                })}
              </p>
            </div>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Lightbox Center Display */}
          <div className="relative flex-1 my-4 flex items-center justify-center">
            <div className="relative w-full h-full max-w-5xl max-h-[75vh]">
              <Image
                src={cleanImages[currentIndex]}
                alt={`${productName} fullscreen`}
                fill
                priority
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {/* Lightbox Navigation Buttons */}
            {cleanImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 cursor-pointer"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 cursor-pointer"
                  aria-label="Next Image"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          {cleanImages.length > 1 && (
            <div className="flex items-center justify-center gap-3 overflow-x-auto py-2 z-10">
              {cleanImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-16 w-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                    currentIndex === idx
                      ? "border-orange-500 ring-2 ring-orange-500/50 scale-105"
                      : "border-white/20 opacity-40 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={imgUrl}
                    alt={`Thumb ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
