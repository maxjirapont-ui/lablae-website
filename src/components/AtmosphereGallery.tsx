"use client";

import React, { useState } from "react";
import { Camera, X, ChevronLeft, ChevronRight, Sparkles, ZoomIn } from "lucide-react";

interface AtmosphereGalleryProps {
  images: string[];
  title?: string;
  subtitle?: string;
}

export default function AtmosphereGallery({
  images,
  title = "ภาพบรรยากาศร้านลำลำลับแลบ้าน ๑๐๐ ปี",
  subtitle = "ใต้ถุนเรือนไม้สักโบราณไร้ตะปู อายุกว่า ๑๐๐ ปี อบอุ่น ร่มรื่น และเต็มไปด้วยกลิ่นอายประวัติศาสตร์",
}: AtmosphereGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => setSelectedIdx(index);
  const closeLightbox = () => setSelectedIdx(null);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx - 1 + images.length) % images.length);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx + 1) % images.length);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent-dark border border-accent/30 text-xs font-thai font-medium tracking-wide">
          <Camera className="w-3.5 h-3.5" />
          บรรยากาศบ้าน ๑๐๐ ปี
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-thai text-primary">
          {title}
        </h2>
        <p className="font-thai text-xs sm:text-sm text-primary/70 max-w-xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Grid Layout: 1 large on left, 3 on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Main Photo (Left) */}
        <div
          onClick={() => openLightbox(0)}
          className="md:col-span-7 relative group rounded-3xl overflow-hidden shadow-md aspect-video md:aspect-[4/3] border border-primary/10 cursor-pointer bg-primary/5"
        >
          <img
            src={images[0]}
            alt="บรรยากาศร้านลำลำลับแล"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
            <span className="text-white text-xs font-thai font-bold inline-flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-xs">
              <ZoomIn className="w-3.5 h-3.5" />
              แตะเพื่อดูภาพขยาย
            </span>
          </div>
        </div>

        {/* Secondary Photos (Right side 2-4 items) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          {images.slice(1, 5).map((img, idx) => {
            const actualIdx = idx + 1;
            const isLastOfGrid = idx === 3 && images.length > 5;
            const remainingCount = images.length - 5;

            return (
              <div
                key={idx}
                onClick={() => openLightbox(actualIdx)}
                className="relative group rounded-2xl overflow-hidden shadow-xs aspect-square border border-primary/10 cursor-pointer bg-primary/5"
              >
                <img
                  src={img}
                  alt={`บรรยากาศร้านภาพที่ ${actualIdx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {isLastOfGrid && remainingCount > 0 ? (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-thai font-bold text-sm">
                    +{remainingCount} รูปเพิ่มเติม
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedIdx !== null && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-50"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Prev */}
          {images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/25 transition-all cursor-pointer z-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Active Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center"
          >
            <img
              src={images[selectedIdx]}
              alt={`ภาพบรรยากาศ ${selectedIdx + 1}`}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-3 text-white/70 font-thai text-xs text-center flex items-center gap-2">
              <span>ภาพที่ {selectedIdx + 1} จากทั้งหมด {images.length} ภาพ</span>
            </div>
          </div>

          {/* Navigation Next */}
          {images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/25 transition-all cursor-pointer z-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
