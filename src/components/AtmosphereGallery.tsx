"use client";

import React, { useState } from "react";
import { Camera, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export interface GalleryImageItem {
  url: string;
  caption?: string;
}

interface AtmosphereGalleryProps {
  images: (string | GalleryImageItem)[];
  badge?: string;
  title?: string;
  subtitle?: string;
}

export default function AtmosphereGallery({
  images,
  badge = "บรรยากาศบ้าน 100 ปี",
  title = "ภาพบรรยากาศร้านลำลำลับแลบ้าน 100 ปี",
  subtitle = "ใต้ถุนบ้านไม้ 100 ปีไร้ตะปู อบอุ่น ร่มรื่น และเต็มไปด้วยกลิ่นอายประวัติศาสตร์",
}: AtmosphereGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  // Normalize image items to always have url and caption
  const normalizedImages: GalleryImageItem[] = images
    .map((item) => {
      if (typeof item === "string") {
        return { url: item, caption: "" };
      }
      return { url: item?.url || "", caption: item?.caption || "" };
    })
    .filter((item) => Boolean(item.url));

  if (normalizedImages.length === 0) return null;

  const openLightbox = (index: number) => setSelectedIdx(index);
  const closeLightbox = () => setSelectedIdx(null);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx - 1 + normalizedImages.length) % normalizedImages.length);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx + 1) % normalizedImages.length);
  };

  const currentImage = selectedIdx !== null ? normalizedImages[selectedIdx] : null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent-dark border border-accent/30 text-xs font-thai font-medium tracking-wide">
          <Camera className="w-3.5 h-3.5" />
          {badge}
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
          className="md:col-span-7 relative group rounded-3xl overflow-hidden shadow-md aspect-video md:aspect-[4/3] border border-accent/25 cursor-pointer bg-[#261810]"
        >
          <img
            src={normalizedImages[0].url}
            alt={normalizedImages[0].caption || "บรรยากาศร้านลำลำลับแล"}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Caption Overlay on Main Photo */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 sm:p-6 flex flex-col justify-end transition-opacity duration-300">
            {normalizedImages[0].caption ? (
              <p className="text-white text-xs sm:text-sm font-thai font-medium drop-shadow-md leading-snug">
                {normalizedImages[0].caption}
              </p>
            ) : (
              <span className="text-white/80 text-xs font-thai font-bold inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5" />
                แตะเพื่อดูภาพขยาย
              </span>
            )}
          </div>
        </div>

        {/* Secondary Photos (Right side 2-4 items) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          {normalizedImages.slice(1, 5).map((img, idx) => {
            const actualIdx = idx + 1;
            const isLastOfGrid = idx === 3 && normalizedImages.length > 5;
            const remainingCount = normalizedImages.length - 5;

            return (
              <div
                key={idx}
                onClick={() => openLightbox(actualIdx)}
                className="relative group rounded-2xl overflow-hidden shadow-xs aspect-square border border-accent/25 cursor-pointer bg-[#261810]"
              >
                <img
                  src={img.url}
                  alt={img.caption || `บรรยากาศร้านภาพที่ ${actualIdx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Caption / Overlay */}
                {isLastOfGrid && remainingCount > 0 ? (
                  <div className="absolute inset-0 bg-black/65 flex items-center justify-center text-white font-thai font-bold text-sm">
                    +{remainingCount} รูปเพิ่มเติม
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 sm:p-3 flex items-end">
                    {img.caption ? (
                      <p className="text-white text-[11px] sm:text-xs font-thai font-medium truncate drop-shadow-md w-full">
                        {img.caption}
                      </p>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full flex justify-end text-white">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedIdx !== null && currentImage && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-50"
            title="ปิด (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Prev */}
          {normalizedImages.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/25 transition-all cursor-pointer z-50"
              title="ภาพก่อนหน้า"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Active Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center px-2"
          >
            <img
              src={currentImage.url}
              alt={currentImage.caption || `ภาพบรรยากาศ ${selectedIdx + 1}`}
              className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-2xl border border-accent/20"
            />

            {/* Prominent Caption below image */}
            {currentImage.caption && (
              <div className="mt-3 px-5 py-2.5 rounded-2xl bg-[#261810]/90 border border-accent/35 max-w-xl text-center shadow-lg">
                <p className="text-accent font-thai font-bold text-sm sm:text-base leading-snug">
                  {currentImage.caption}
                </p>
              </div>
            )}

            {/* Counter */}
            <div className="mt-2 text-white/60 font-thai text-xs text-center flex items-center gap-2">
              <span>ภาพที่ {selectedIdx + 1} จากทั้งหมด {normalizedImages.length} ภาพ</span>
            </div>
          </div>

          {/* Navigation Next */}
          {normalizedImages.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/25 transition-all cursor-pointer z-50"
              title="ภาพถัดไป"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
