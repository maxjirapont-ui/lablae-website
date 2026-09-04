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
  Link as LinkIcon,
  Tag,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";

interface HeroSectionEditorProps {
  currentHeroImage: string;
  currentBadge: string;
  currentTitle: string;
  currentSubtitle: string;
  currentDescription: string;
  currentBtn1Text: string;
  currentBtn1Link: string;
  currentBtn2Text: string;
  currentBtn2Link: string;
  onSave: (data: {
    home_hero_image: string;
    hero_badge: string;
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    hero_btn1_text: string;
    hero_btn1_link: string;
    hero_btn2_text: string;
    hero_btn2_link: string;
  }) => Promise<void>;
  handleFileUpload: (
    file: File,
    onSuccess: (url: string) => void,
    onError?: (err: string) => void
  ) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_HERO_VALUES = {
  hero_badge: "เรือนไม้สักโบราณไร้ตะปู ๑๐๐ ปี · อ.ลับแล จ.อุตรดิตถ์",
  hero_title: "ร้านลำลำลับแลบ้าน ๑๐๐ ปี",
  hero_subtitle: "กับข้าวรสมือครอบครัว ใต้ถุนเรือนไม้ไร้ตะปู",
  hero_description:
    "อาหารพื้นเมืองลับแลดั้งเดิม พริกแกงโขลกมือ ข้าวพันผัก และชุดขันโตกสูตรโบราณ ๔ รุ่น แวะมากินข้าวบ้านญาตินะครับ",
  hero_btn1_text: "ดูเมนูอาหารทั้งหมด",
  hero_btn1_link: "/menu",
  hero_btn2_text: "รู้จักกับเรา & ตำนานลับแล",
  hero_btn2_link: "/about",
};

export default function HeroSectionEditor({
  currentHeroImage,
  currentBadge,
  currentTitle,
  currentSubtitle,
  currentDescription,
  currentBtn1Text,
  currentBtn1Link,
  currentBtn2Text,
  currentBtn2Link,
  onSave,
  handleFileUpload,
  isLoading,
}: HeroSectionEditorProps) {
  const [heroImage, setHeroImage] = useState(currentHeroImage || "");
  const [badge, setBadge] = useState(currentBadge || DEFAULT_HERO_VALUES.hero_badge);
  const [title, setTitle] = useState(currentTitle || DEFAULT_HERO_VALUES.hero_title);
  const [subtitle, setSubtitle] = useState(currentSubtitle || DEFAULT_HERO_VALUES.hero_subtitle);
  const [description, setDescription] = useState(
    currentDescription || DEFAULT_HERO_VALUES.hero_description
  );
  const [btn1Text, setBtn1Text] = useState(currentBtn1Text || DEFAULT_HERO_VALUES.hero_btn1_text);
  const [btn1Link, setBtn1Link] = useState(currentBtn1Link || DEFAULT_HERO_VALUES.hero_btn1_link);
  const [btn2Text, setBtn2Text] = useState(currentBtn2Text || DEFAULT_HERO_VALUES.hero_btn2_text);
  const [btn2Link, setBtn2Link] = useState(currentBtn2Link || DEFAULT_HERO_VALUES.hero_btn2_link);

  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setHeroImage(currentHeroImage || "");
    setBadge(currentBadge || DEFAULT_HERO_VALUES.hero_badge);
    setTitle(currentTitle || DEFAULT_HERO_VALUES.hero_title);
    setSubtitle(currentSubtitle || DEFAULT_HERO_VALUES.hero_subtitle);
    setDescription(currentDescription || DEFAULT_HERO_VALUES.hero_description);
    setBtn1Text(currentBtn1Text || DEFAULT_HERO_VALUES.hero_btn1_text);
    setBtn1Link(currentBtn1Link || DEFAULT_HERO_VALUES.hero_btn1_link);
    setBtn2Text(currentBtn2Text || DEFAULT_HERO_VALUES.hero_btn2_text);
    setBtn2Link(currentBtn2Link || DEFAULT_HERO_VALUES.hero_btn2_link);
    setIsDirty(false);
  }, [
    currentHeroImage,
    currentBadge,
    currentTitle,
    currentSubtitle,
    currentDescription,
    currentBtn1Text,
    currentBtn1Link,
    currentBtn2Text,
    currentBtn2Link,
  ]);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      home_hero_image: heroImage,
      hero_badge: badge.trim(),
      hero_title: title.trim(),
      hero_subtitle: subtitle.trim(),
      hero_description: description.trim(),
      hero_btn1_text: btn1Text.trim(),
      hero_btn1_link: btn1Link.trim(),
      hero_btn2_text: btn2Text.trim(),
      hero_btn2_link: btn2Link.trim(),
    });
    setIsDirty(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleResetDefaults = () => {
    if (!confirm("คุณต้องการคืนค่าข้อความฮีโร่ทั้งหมดเป็นค่าเริ่มต้นของระบบใช่หรือไม่? (รูปภาพปกจะไม่ถูกเปลี่ยน)")) {
      return;
    }
    setBadge(DEFAULT_HERO_VALUES.hero_badge);
    setTitle(DEFAULT_HERO_VALUES.hero_title);
    setSubtitle(DEFAULT_HERO_VALUES.hero_subtitle);
    setDescription(DEFAULT_HERO_VALUES.hero_description);
    setBtn1Text(DEFAULT_HERO_VALUES.hero_btn1_text);
    setBtn1Link(DEFAULT_HERO_VALUES.hero_btn1_link);
    setBtn2Text(DEFAULT_HERO_VALUES.hero_btn2_text);
    setBtn2Link(DEFAULT_HERO_VALUES.hero_btn2_link);
    setIsDirty(true);
  };

  return (
    <div className="p-6 sm:p-8 bg-white rounded-3xl border border-primary/10 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-[11px] font-bold">
              รูปภาพปก & ข้อความหลักหน้าแรก
            </span>
            <span className="text-xs font-bold text-primary">
              ฮีโร่แบนเนอร์ (Main Hero Section)
            </span>
          </div>
          <h3 className="text-lg font-bold text-primary">
            ๑. ภาพหลักฮีโร่และคำอธิบาย (Hero Banner & Story Texts)
          </h3>
          <p className="text-xs text-primary/70 leading-relaxed">
            จุดแรกที่ลูกค้าเปิดเข้ามาพบ สามารถเปลี่ยนรูปภาพพื้นหลัง ป้ายกำกับ ชื่อร้าน คำโปรย คำอธิบาย และปุ่มกดได้ทั้งหมด
          </p>
        </div>

        {/* Live Preview Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-primary/15 text-xs font-semibold text-primary/80 hover:bg-cream hover:text-primary transition-colors cursor-pointer shrink-0"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>ซ่อนตัวอย่าง</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>ดูตัวอย่างการแสดงผลจริง</span>
            </>
          )}
        </button>
      </div>

      {/* Live Preview Box */}
      {showPreview && (
        <div className="p-6 rounded-3xl bg-[#1a100a] border border-accent/35 text-[#f7eee3] space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-accent/20 pb-2">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              ตัวอย่างการแสดงผลจริงบนหน้าแรก (Live Preview)
            </span>
            <span className="text-[10px] text-accent/70">อัปเดตแบบเรียลไทม์ตามที่คุณพิมพ์</span>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[340px] flex items-center justify-center p-6 text-center bg-cover bg-center border border-accent/25"
            style={{
              backgroundImage: heroImage ? `url('${heroImage}')` : "none",
              backgroundColor: "#241710",
            }}
          >
            {/* Atmospheric overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-[#1a100a]/90" />

            <div className="relative max-w-2xl mx-auto space-y-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/35 text-[11px] font-medium tracking-wide">
                <Sparkles className="w-3 h-3" />
                {badge || "—"}
              </span>

              <h4 className="font-bold text-xl sm:text-3xl text-[#fff8ee] leading-tight drop-shadow-md">
                {title || "—"}
                {subtitle && (
                  <span className="block text-sm sm:text-lg text-accent font-normal mt-1.5 drop-shadow-sm">
                    {subtitle}
                  </span>
                )}
              </h4>

              <p className="text-xs sm:text-sm text-[#f7eee3]/90 max-w-lg mx-auto leading-relaxed">
                {description || "—"}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <span className="px-5 py-2 rounded-full bg-gradient-to-r from-accent to-[#e6b87d] text-[#1a100a] font-bold text-xs shadow-md">
                  {btn1Text || "ปุ่ม 1"}
                </span>
                <span className="px-5 py-2 rounded-full border border-accent/60 text-[#f7eee3] font-semibold text-xs">
                  {btn2Text || "ปุ่ม 2"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Image Upload & Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Row 1: Image Upload + Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Image Preview */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-primary">
              รูปภาพพื้นหลังปกฮีโร่ (Hero Background Image)
            </label>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-primary/15 bg-primary/5 group shadow-inner">
              {heroImage ? (
                <>
                  <img
                    src={heroImage}
                    alt="รูปหน้าปกเว็บไซต์"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-white text-xs font-semibold">
                    <span>รูปภาพปัจจุบัน</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-primary/40 text-xs gap-2">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span>ยังไม่มีรูปภาพปก</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <input
              type="file"
              accept="image/*"
              id="upload-hero-main"
              className="hidden"
              disabled={isLoading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await handleFileUpload(file, (url) => {
                  setHeroImage(url);
                  setIsDirty(true);
                });
              }}
            />
            <label
              htmlFor="upload-hero-main"
              className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                isLoading
                  ? "bg-primary/20 text-primary/50 cursor-not-allowed"
                  : "bg-accent hover:bg-accent-dark text-white hover:scale-[1.01]"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isLoading ? "กำลังอัปโหลด..." : "📷 เปลี่ยนรูปภาพปกฮีโร่"}</span>
            </label>
          </div>

          {/* Texts Column */}
          <div className="md:col-span-7 space-y-4">
            {/* Badge */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-accent" />
                <span>ป้ายกำกับบนสุด (Badge)</span>
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => handleFieldChange(setBadge, e.target.value)}
                placeholder="เช่น เรือนไม้สักโบราณไร้ตะปู ๑๐๐ ปี · อ.ลับแล จ.อุตรดิตถ์"
                className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs font-medium text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-accent" />
                <span>ชื่อร้าน / หัวข้อหลัก (Title)</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleFieldChange(setTitle, e.target.value)}
                placeholder="เช่น ร้านลำลำลับแลบ้าน ๑๐๐ ปี"
                className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs font-bold text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>คำโปรยใต้ชื่อร้าน (Subtitle)</span>
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => handleFieldChange(setSubtitle, e.target.value)}
                placeholder="เช่น กับข้าวรสมือครอบครัว ใต้ถุนเรือนไม้ไร้ตะปู"
                className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs font-medium text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>คำอธิบายหน้าแรก (Description)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => handleFieldChange(setDescription, e.target.value)}
                placeholder="พิมพ์คำอธิบายสั้นๆ ของร้านเพื่อต้อนรับลูกค้าบนหน้าแรก..."
                className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs leading-relaxed text-primary focus:outline-hidden focus:ring-2 focus:ring-accent font-sans"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-cream/40 border border-primary/10">
          <div className="space-y-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-accent" />
              <span>ปุ่มที่ ๑ (Primary Button)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-primary/60 mb-0.5">ชื่อปุ่ม</label>
                <input
                  type="text"
                  value={btn1Text}
                  onChange={(e) => handleFieldChange(setBtn1Text, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-primary/20 bg-white text-xs text-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] text-primary/60 mb-0.5">ลิงก์ URL</label>
                <input
                  type="text"
                  value={btn1Link}
                  onChange={(e) => handleFieldChange(setBtn1Link, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-primary/20 bg-white text-xs text-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-accent" />
              <span>ปุ่มที่ ๒ (Secondary Button)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-primary/60 mb-0.5">ชื่อปุ่ม</label>
                <input
                  type="text"
                  value={btn2Text}
                  onChange={(e) => handleFieldChange(setBtn2Text, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-primary/20 bg-white text-xs text-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] text-primary/60 mb-0.5">ลิงก์ URL</label>
                <input
                  type="text"
                  value={btn2Link}
                  onChange={(e) => handleFieldChange(setBtn2Link, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-primary/20 bg-white text-xs text-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกรูปภาพและข้อความปกฮีโร่สำเร็จแล้ว!</span>
              </span>
            )}
            {isDirty && !saveSuccess && (
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
              <span>คืนค่าข้อความเริ่มต้น</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "กำลังบันทึก..." : "💾 บันทึกรูปภาพและข้อความปกฮีโร่"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
