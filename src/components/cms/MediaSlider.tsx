"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import Image from "next/image";
import { cn } from "@/lib/utils";
import unsplashLoader from "@/lib/image-loader";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface MediaItem {
  id: number;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  mediaType: "image" | "video" | "audio" | "document";
}

interface MediaSliderProps {
  items: MediaItem[];
  className?: string;
  aspectRatio?: string;
  overlayColor?: string;
}

export const MediaSlider: React.FC<MediaSliderProps> = ({
  items,
  className,
  aspectRatio = "aspect-video",
  overlayColor = "from-black/60 to-transparent",
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn("w-full overflow-hidden rounded-2xl shadow-2xl bg-slate-100", className)}>
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        effect="fade"
        speed={1000}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        navigation={items.length > 1}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        className={cn("w-full h-full", aspectRatio)}
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} className="relative w-full h-full overflow-hidden">
            {item.mediaType === "video" ? (
              <video
                src={item.url}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                loader={unsplashLoader}
                src={item.url}
                alt={item.caption || "Slider image"}
                fill
                className="object-cover transition-transform duration-[10000ms] ease-out hover:scale-110"
                priority
              />
            )}

            {/* Content Overlays */}
            {(item.caption || item.mediaType === "video") && (
              <div className={cn("absolute inset-x-0 bottom-0 p-8 pb-12 bg-gradient-to-t z-10", overlayColor)}>
                <div className="max-w-3xl mx-auto space-y-2">
                  {item.caption && (
                    <p className="text-white text-lg md:text-2xl font-black italic uppercase tracking-tighter drop-shadow-lg transform transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
                      {item.caption}
                    </p>
                  )}
                  {item.mediaType === "video" && (
                     <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Live Content</span>
                     </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Glassmorphism accent */}
            <div className="absolute top-4 right-4 z-20">
               <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1 text-[10px] text-white font-bold tracking-widest uppercase">
                  {item.id.toString().padStart(2, '0')}
               </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: white !important;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          width: 50px !important;
          height: 50px !important;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 20px !important;
          font-weight: bold;
        }
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.1);
        }
        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          width: 24px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
};
