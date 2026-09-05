"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Type,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Tag,
  Plus,
} from "lucide-react";
import { GalleryImageItem } from "./AtmosphereGallery";

interface AmbienceGalleryEditorProps {
  currentItems: GalleryImageItem[];
  currentBadge: string;
  currentTitle: string;
  currentSubtitle: string;
  onSave: (data: {
    restaurant_gallery: string;
    gallery_badge: string;
    gallery_title: string;
    gallery_subtitle: string;
  }) => Promise<void>;
  handleFileUpload: (
    file: File,
    onSuccess: (url: string) => void,
    onError?: (err: string) => void
  ) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_GALLERY_VALUES = {
  gallery_badge: "บรรยากาศบ้าน ๑๐๐ ปี",
  gallery_title: "ภาพบรรยากาศร้านลำลำลับแลบ้าน ๑๐๐ ปี",
  gallery_subtitle:
    "ใต้ถุนเรือนไม้สักโบราณไร้ตะปู อายุกว่า ๑๐๐ ปี อบอุ่น ร่มรื่น และสัมผัสรสมือครอบครัวแท้ๆ",
};

export default function AmbienceGalleryEditor({
  currentItems,
  currentBadge,
  currentTitle,
  currentSubtitle,
  onSave,
  handleFileUpload,
  isLoading,
}: AmbienceGalleryEditorProps) {
  const [items, setItems] = useState<GalleryImageItem[]>(currentItems || []);
  const [badge, setBadge] = useState(currentBadge || DEFAULT_GALLERY_VALUES.gallery_badge);
  const [title, setTitle] = useState(currentTitle || DEFAULT_GALLERY_VALUES.gallery_title);
  const [subtitle, setSubtitle] = useState(
    currentSubtitle || DEFAULT_GALLERY_VALUES.gallery_subtitle
  );

  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);

  useEffect(() => {
    setItems(currentItems || []);
    setBadge(currentBadge || DEFAULT_GALLERY_VALUES.gallery_badge);
    setTitle(currentTitle || DEFAULT_GALLERY_VALUES.gallery_title);
    setSubtitle(currentSubtitle || DEFAULT_GALLERY_VALUES.gallery_subtitle);
    setIsDirty(false);
    setErrorMessage("");
  }, [currentItems, currentBadge, currentTitle, currentSubtitle]);

  const handleCaptionChange = (index: number, caption: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], caption };
      return next;
    });
    setIsDirty(true);
    setSaveSuccess(false);
    setErrorMessage("");
  };

  const handleDeletePhoto = (index: number) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบรูปภาพบรรยากาศนี้ใช่หรือไม่?")) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
    setSaveSuccess(false);
    setErrorMessage("");
  };

  const handleMovePhoto = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index > 0) {
      setItems((prev) => {
        const next = [...prev];
        const temp = next[index];
        next[index] = next[index - 1];
        next[index - 1] = temp;
        return next;
      });
      setIsDirty(true);
      setSaveSuccess(false);
      setErrorMessage("");
    } else if (direction === "right" && index < items.length - 1) {
      setItems((prev) => {
        const next = [...prev];
        const temp = next[index];
        next[index] = next[index + 1];
        next[index + 1] = temp;
        return next;
      });
      setIsDirty(true);
      setSaveSuccess(false);
      setErrorMessage("");
    }
  };

  const handleUploadMultiple = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingCount(files.length);
    const newItems = [...items];

    for (const file of files) {
      await new Promise<void>((resolve) => {
        handleFileUpload(
          file,
          (url) => {
            newItems.push({
              url,
              caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            });
            resolve();
          },
          () => resolve()
        );
      });
    }

    setItems(newItems);
    setUploadingCount(0);
    setIsDirty(true);
    setSaveSuccess(false);
    setErrorMessage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const cleanItems = items.filter((i) => Boolean(i.url));
    try {
      await onSave({
        restaurant_gallery: JSON.stringify(cleanItems),
        gallery_badge: badge.trim(),
        gallery_title: title.trim(),
        gallery_subtitle: subtitle.trim(),
      });
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleResetDefaults = () => {
    if (!confirm("คุณต้องการคืนค่าหัวข้อและคำอธิบายอัลบั้มเป็นค่าเริ่มต้นใช่หรือไม่? (รูปภาพและคำอธิบายใต้รูปจะไม่ถูกลบ)")) {
      return;
    }
    setBadge(DEFAULT_GALLERY_VALUES.gallery_badge);
    setTitle(DEFAULT_GALLERY_VALUES.gallery_title);
    setSubtitle(DEFAULT_GALLERY_VALUES.gallery_subtitle);
    setIsDirty(true);
  };

  return (
    <div className="p-6 sm:p-8 bg-white rounded-3xl border border-primary/10 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-[11px] font-bold">
              อัลบั้มแกลเลอรี่บรรยากาศ
            </span>
            <span className="text-xs font-bold text-primary">
              {items.length} รูปในอัลบั้ม
            </span>
          </div>
          <h3 className="text-lg font-bold text-primary">
            ๕. คลังภาพบรรยากาศร้านและคำอธิบายภาพ (Atmosphere Gallery Album)
          </h3>
          <p className="text-xs text-primary/70 leading-relaxed">
            เพิ่มรูปภาพบรรยากาศร้าน (เช่น มุมโต๊ะอาหาร, ใต้ถุนเรือนไม้สัก, โคมไฟ, มุมสวน) พร้อมใส่คำอธิบายภาพแต่ละรูปได้
          </p>
        </div>

        {/* Buttons Header */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/15 text-xs font-semibold text-primary/80 hover:bg-cream hover:text-primary transition-colors cursor-pointer"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>ซ่อนตัวอย่าง</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>ดูตัวอย่างการแสดงผล</span>
              </>
            )}
          </button>

          {/* Upload Button */}
          <input
            type="file"
            multiple
            accept="image/*"
            id="upload-gallery-album-multi"
            className="hidden"
            disabled={isLoading || uploadingCount > 0}
            onChange={handleUploadMultiple}
          />
          <label
            htmlFor="upload-gallery-album-multi"
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
              isLoading || uploadingCount > 0
                ? "bg-primary/20 text-primary/50 cursor-not-allowed"
                : "bg-accent hover:bg-accent-dark text-white hover:scale-[1.01]"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {uploadingCount > 0
                ? `กำลังอัปโหลด (${uploadingCount})...`
                : "+ เพิ่มรูปบรรยากาศ (เลือกได้หลายรูป)"}
            </span>
          </label>
        </div>
      </div>

      {/* Live Preview Box */}
      {showPreview && (
        <div className="p-6 rounded-3xl bg-[#1a100a] border border-accent/35 text-[#f7eee3] space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-accent/20 pb-2">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              ตัวอย่างการแสดงผลบนหน้าแรก (Live Preview)
            </span>
            <span className="text-[10px] text-accent/70">อัปเดตแบบเรียลไทม์</span>
          </div>

          <div className="text-center space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
              <Camera className="w-3.5 h-3.5" />
              {badge || "บรรยากาศบ้าน ๑๐๐ ปี"}
            </span>
            <h4 className="text-xl font-bold text-[#fff8ee]">{title || "—"}</h4>
            <p className="text-xs text-accent/80 max-w-lg mx-auto">{subtitle || "—"}</p>
          </div>

          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {items.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden aspect-4/3 border border-accent/25 bg-[#261810]"
                >
                  <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                    <p className="text-white text-xs font-thai truncate">
                      {item.caption || "(ไม่มีคำอธิบาย)"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form & Photo Grid */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Row 1: Album Headings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-cream/40 border border-primary/10">
          <div className="space-y-1">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>ป้ายกำกับอัลบั้ม (Badge)</span>
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => {
                setBadge(e.target.value);
                setIsDirty(true);
                setSaveSuccess(false);
              }}
              placeholder="เช่น บรรยากาศบ้าน ๑๐๐ ปี"
              className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-white text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-accent" />
              <span>ชื่อหัวข้ออัลบั้ม (Title)</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
                setSaveSuccess(false);
              }}
              placeholder="เช่น ภาพบรรยากาศร้านลำลำลับแลบ้าน ๑๐๐ ปี"
              className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-white text-xs font-bold text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>คำโปรย/คำอธิบายอัลบั้ม (Subtitle)</span>
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value);
                setIsDirty(true);
                setSaveSuccess(false);
              }}
              placeholder="เช่น ใต้ถุนเรือนไม้สักโบราณไร้ตะปู อายุกว่า ๑๐๐ ปี..."
              className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-white text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Photos Grid with Individual Captions */}
        {items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-primary">
                รายการรูปภาพในอัลบั้ม ({items.length} รูป) — สามารถพิมพ์คำอธิบายใต้รูปแต่ละรูปได้ทันที:
              </label>
              <span className="text-[11px] text-primary/50">
                สามารถสลับลำดับภาพซ้าย-ขวาได้
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-primary/15 bg-white shadow-xs space-y-2.5 group"
                >
                  {/* Image Card */}
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-primary/5 border border-primary/10">
                    <img
                      src={item.url}
                      alt={item.caption || `ภาพบรรยากาศ ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                    {/* Order badge */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      #{idx + 1}
                    </div>

                    {/* Reorder & Delete buttons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(idx, "left")}
                          className="p-1 rounded-full bg-black/60 hover:bg-black text-white cursor-pointer shadow-xs"
                          title="เลื่อนไปซ้าย"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < items.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(idx, "right")}
                          className="p-1 rounded-full bg-black/60 hover:bg-black text-white cursor-pointer shadow-xs"
                          title="เลื่อนไปขวา"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(idx)}
                        className="p-1 rounded-full bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs"
                        title="ลบรูปนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Caption Input */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-primary/70">
                      คำอธิบายภาพที่ #{idx + 1}:
                    </label>
                    <input
                      type="text"
                      value={item.caption || ""}
                      onChange={(e) => handleCaptionChange(idx, e.target.value)}
                      placeholder="เช่น มุมโต๊ะใต้ถุนเรือน, โคมไฟล้านนา..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-cream/30 text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-10 border-2 border-dashed border-primary/20 rounded-2xl text-center space-y-3 bg-cream/30">
            <div className="inline-flex p-3 bg-white rounded-2xl text-accent">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-primary">ยังไม่มีรูปภาพในอัลบั้มบรรยากาศ</h4>
            <p className="text-xs text-primary/60 max-w-sm mx-auto">
              แตะปุ่ม "+ เพิ่มรูปบรรยากาศ" ด้านบนเพื่อเลือกรูปภาพจากมือถือหรือคอมพิวเตอร์ สามารถเลือกได้ครั้งละหลายๆ รูป
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกอัลบั้มและคำอธิบายภาพบรรยากาศสำเร็จแล้ว!</span>
              </span>
            )}
            {errorMessage && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{errorMessage}</span>
              </span>
            )}
            {isDirty && !saveSuccess && !errorMessage && (
              <span className="text-xs text-amber-700 font-medium">
                ⚠️ มีการแก้ไขที่ยังไม่ได้กดบันทึก
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-primary/20 text-xs font-semibold text-primary/70 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าหัวข้อเริ่มต้น</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "กำลังบันทึก..." : "💾 บันทึกอัลบั้มและคำอธิบายภาพทั้งหมด"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
