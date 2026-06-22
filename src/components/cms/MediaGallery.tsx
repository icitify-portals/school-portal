"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, Music, FileText, Maximize2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import unsplashLoader from "@/lib/image-loader";

interface MediaItem {
  id: number;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  mediaType: "image" | "video" | "audio" | "document";
}

interface MediaGalleryProps {
  items: MediaItem[];
  className?: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ items, className }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {items.map((item) => (
        <Dialog key={item.id}>
          <DialogTrigger asChild>
            <div className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-200 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
              {item.mediaType === "video" ? (
                <div className="relative w-full h-full">
                  <Image
                    src={item.thumbnailUrl || "/api/placeholder/400/400"}
                    alt={item.caption || "Video preview"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : item.mediaType === "audio" ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 group-hover:bg-indigo-100 transition-colors gap-3">
                  <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Music className="w-8 h-8 text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Audio Preview</span>
                </div>
              ) : item.mediaType === "document" ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 group-hover:bg-emerald-100 transition-colors gap-3">
                  <FileText className="w-12 h-12 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Document</span>
                </div>
              ) : (
                <Image
                  loader={unsplashLoader}
                  src={item.url}
                  alt={item.caption || "Gallery image"}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <p className="text-white text-xs font-bold truncate">{item.caption || "Untitled Content"}</p>
                <div className="mt-2 flex items-center gap-2">
                   <div className="text-[8px] text-white/70 uppercase font-black border border-white/20 rounded-md px-1.5 py-0.5 backdrop-blur-sm">
                      {item.mediaType}
                   </div>
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
            <div className="relative w-full max-h-[90vh] flex items-center justify-center p-4">
              {item.mediaType === "video" ? (
                <video
                  src={item.url}
                  controls
                  autoPlay
                  className="w-full h-auto rounded-xl shadow-2xl"
                />
              ) : item.mediaType === "audio" ? (
                <div className="bg-white p-12 rounded-2xl w-full max-w-md shadow-2xl flex flex-col items-center gap-6">
                  <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center animate-bounce">
                    <Music className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-center">{item.caption || "Audio Track"}</h3>
                  <audio src={item.url} controls className="w-full" />
                </div>
              ) : item.mediaType === "document" ? (
                 <div className="bg-white p-12 rounded-2xl w-full max-w-md shadow-2xl flex flex-col items-center gap-6">
                    <FileText className="w-16 h-16 text-emerald-600" />
                    <h3 className="text-xl font-bold text-center">{item.caption || "Document"}</h3>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105"
                    >
                       View Document
                       <ExternalLink className="w-4 h-4" />
                    </a>
                 </div>
              ) : (
                <div className="relative w-full h-[80vh]">
                  <Image
                    loader={unsplashLoader}
                    src={item.url}
                    alt={item.caption || "Fullscreen image"}
                    fill
                    className="object-contain"
                  />
                  {item.caption && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 text-white text-sm font-bold">
                      {item.caption}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};
