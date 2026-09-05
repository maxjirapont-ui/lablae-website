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
  Quote,
  CheckCircle2,
  Image as ImageIcon,
  Tag,
  AlertCircle,
} from "lucide-react";

interface AmbienceStoryEditorProps {
  currentAboutImage: string;
  currentImageCaption: string;
  currentBadge: string;
  currentTitle: string;
  currentQuote: string;
  currentQuoteAuthor: string;
  currentStoryText: string;
  onSave: (data: {
    home_about_image: string;
    home_about_image_caption: string;
    about_badge: string;
    about_title: string;
    about_quote: string;
    about_quote_author: string;
    about_story_text: string;
  }) => Promise<void>;
  handleFileUpload: (
    file: File,
    onSuccess: (url: string) => void,
    onError?: (err: string) => void
  ) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_STORY_VALUES = {
  home_about_image_caption: "บรรยากาศร้านลำลำลับแล ใต้ถุนบ้านไม้ 100 ปี",
  about_badge: "เรื่องเล่าจากบ้าน 100 ปี",
  about_title: "บ้านหลังนี้คือบ้านของครอบครัวเราจริง ๆ",
  about_quote:
    "“นี่คือรสมือครอบครัวเรา ไม่ได้อวดว่าเลิศที่สุด แต่รับรองว่าเป็นของจริง ที่เรากินกันมาตั้งแต่ทวด”",
  about_quote_author: "— คำของตาเงิน–ยายจัน และคนทำครัวบ้าน 100 ปี",
  about_story_text:
    "อายุกว่าร้อยปี ทวดเราสร้างไว้โดยไม่ใช้ตะปูเลยสักตัว ไม้ทุกแผ่นเข้าเดือยกันเองแบบช่างสมัยก่อน เราโตมากับบ้านหลังนี้ กินข้าวที่ตายายทำแทบทุกวัน\n\nลับแลเป็นเมืองที่ซ่อนตัวอยู่ในหุบเขา ทางเหนือหัวดงพูดคำเมืองแบบล้านนา ทางใต้แถบทุ่งยั้งสืบสำเนียงสุโขทัย สองสายวัฒนธรรมอยู่ร่วมกันมาหลายร้อยปี จนเกิดเป็นรสชาติที่ไม่ใช่เหนือแท้ ไม่ใช่กลางแท้ แต่เป็นของที่นี่ ของลับแลเท่านั้น\n\nจานที่คุณสั่ง ล้วนสืบมาจากครัวของตากับยาย พริกแกงป้าชุมกับป้าชิดยังทำเองทุกวัน ไม่ใช้ของสำเร็จเลยสักอย่าง สมุนไพรเราก็ช่วยกันปลูกหลังบ้านและในชุมชน แวะมากินข้าวที่นี่ เหมือนมากินข้าวบ้านญาติครับ",
};

export default function AmbienceStoryEditor({
  currentAboutImage,
  currentImageCaption,
  currentBadge,
  currentTitle,
  currentQuote,
  currentQuoteAuthor,
  currentStoryText,
  onSave,
  handleFileUpload,
  isLoading,
}: AmbienceStoryEditorProps) {
  const [aboutImage, setAboutImage] = useState(currentAboutImage || "");
  const [imageCaption, setImageCaption] = useState(
    currentImageCaption || DEFAULT_STORY_VALUES.home_about_image_caption
  );
  const [badge, setBadge] = useState(currentBadge || DEFAULT_STORY_VALUES.about_badge);
  const [title, setTitle] = useState(currentTitle || DEFAULT_STORY_VALUES.about_title);
  const [quote, setQuote] = useState(currentQuote || DEFAULT_STORY_VALUES.about_quote);
  const [quoteAuthor, setQuoteAuthor] = useState(
    currentQuoteAuthor || DEFAULT_STORY_VALUES.about_quote_author
  );
  const [storyText, setStoryText] = useState(
    currentStoryText || DEFAULT_STORY_VALUES.about_story_text
  );

  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Reset the draft after saved story props change. */
    setAboutImage(currentAboutImage || "");
    setImageCaption(currentImageCaption || DEFAULT_STORY_VALUES.home_about_image_caption);
    setBadge(currentBadge || DEFAULT_STORY_VALUES.about_badge);
    setTitle(currentTitle || DEFAULT_STORY_VALUES.about_title);
    setQuote(currentQuote || DEFAULT_STORY_VALUES.about_quote);
    setQuoteAuthor(currentQuoteAuthor || DEFAULT_STORY_VALUES.about_quote_author);
    setStoryText(currentStoryText || DEFAULT_STORY_VALUES.about_story_text);
    setIsDirty(false);
    setErrorMessage("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [
    currentAboutImage,
    currentImageCaption,
    currentBadge,
    currentTitle,
    currentQuote,
    currentQuoteAuthor,
    currentStoryText,
  ]);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setIsDirty(true);
    setSaveSuccess(false);
    setErrorMessage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      await onSave({
        home_about_image: aboutImage,
        home_about_image_caption: imageCaption.trim(),
        about_badge: badge.trim(),
        about_title: title.trim(),
        about_quote: quote.trim(),
        about_quote_author: quoteAuthor.trim(),
        about_story_text: storyText.trim(),
      });
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleResetDefaults = () => {
    if (
      !confirm(
        "คุณต้องการคืนค่าข้อความและคำอธิบายเรื่องเล่าทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่? (รูปภาพจะไม่ถูกลบ)"
      )
    ) {
      return;
    }
    setImageCaption(DEFAULT_STORY_VALUES.home_about_image_caption);
    setBadge(DEFAULT_STORY_VALUES.about_badge);
    setTitle(DEFAULT_STORY_VALUES.about_title);
    setQuote(DEFAULT_STORY_VALUES.about_quote);
    setQuoteAuthor(DEFAULT_STORY_VALUES.about_quote_author);
    setStoryText(DEFAULT_STORY_VALUES.about_story_text);
    setIsDirty(true);
  };

  const parsedParagraphs = storyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="p-6 sm:p-8 bg-white rounded-3xl border border-primary/10 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-[11px] font-bold">
              รูปภาพบรรยากาศ & เรื่องเล่า
            </span>
            <span className="text-xs font-bold text-primary">
              ส่วนเรื่องเล่าบ้าน 100 ปี (Intro Story Section)
            </span>
          </div>
          <h3 className="text-lg font-bold text-primary">
            2. รูปภาพบรรยากาศเรือนไม้และคำอธิบายเรื่องเล่า (Story Section)
          </h3>
          <p className="text-xs text-primary/70 leading-relaxed">
            รูปภาพบรรยากาศเรือนไม้ที่แสดงคู่กับเนื้อหาเรื่องเล่า สามารถเปลี่ยนรูป คำบรรยายใต้รูป คำคม และเนื้อเรื่องประวัติได้ทั้งหมด
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
              ตัวอย่างการแสดงผลบนหน้าแรก (Live Preview)
            </span>
            <span className="text-[10px] text-accent/70">อัปเดตแบบเรียลไทม์</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Story Text Preview */}
            <div className="space-y-3">
              <span className="text-accent font-bold text-xs tracking-wider uppercase">
                {badge || "—"}
              </span>
              <h4 className="text-xl font-bold text-[#fff8ee] leading-tight">
                {title || "—"}
              </h4>

              {quote && (
                <blockquote className="p-3.5 rounded-xl bg-accent/15 border-l-3 border-accent text-xs italic text-[#f7eee3]/95 leading-relaxed">
                  {quote}
                  {quoteAuthor && (
                    <span className="block not-italic font-semibold text-accent text-[11px] mt-1 text-right">
                      {quoteAuthor}
                    </span>
                  )}
                </blockquote>
              )}

              <div className="space-y-2 text-xs text-[#f5ece1]/80 leading-relaxed max-h-36 overflow-y-auto pr-2">
                {parsedParagraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>

            {/* Photo Preview with Caption */}
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-accent/25 shadow-lg bg-[#241710]">
              {aboutImage ? (
                <img
                  src={aboutImage}
                  alt={imageCaption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-accent/40 text-xs">
                  ไม่มีรูปภาพ
                </div>
              )}
              {imageCaption && (
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                  <p className="text-xs text-[#f7eee3] font-medium text-center">
                    {imageCaption}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Row 1: Image & Caption */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Image Column */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-primary">
              รูปภาพบรรยากาศบ้านไม้ 100 ปี (About Image)
            </label>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-primary/15 bg-primary/5 group shadow-inner">
              {aboutImage ? (
                <>
                  <img
                    src={aboutImage}
                    alt={imageCaption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-white text-xs font-semibold">
                    <span>รูปภาพปัจจุบัน</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-primary/40 text-xs gap-2">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span>ยังไม่มีรูปภาพบรรยากาศ</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <input
              type="file"
              accept="image/*"
              id="upload-about-main"
              className="hidden"
              disabled={isLoading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await handleFileUpload(file, (url) => {
                  setAboutImage(url);
                  setIsDirty(true);
                });
              }}
            />
            <label
              htmlFor="upload-about-main"
              className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                isLoading
                  ? "bg-primary/20 text-primary/50 cursor-not-allowed"
                  : "bg-accent hover:bg-accent-dark text-white hover:scale-[1.01]"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isLoading ? "กำลังอัปโหลด..." : "📷 เปลี่ยนรูปภาพบรรยากาศ"}</span>
            </label>

            {/* Image Caption */}
            <div className="pt-2 space-y-1">
              <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>คำอธิบายใต้รูปภาพ</span>
              </label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => handleFieldChange(setImageCaption, e.target.value)}
                placeholder="เช่น บรรยากาศร้านลำลำลับแล ใต้ถุนบ้านไม้ 100 ปี"
                className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
              />
              <p className="text-[10px] text-primary/50">
                ข้อความนี้จะแสดงซ้อนที่ด้านล่างของรูปภาพบรรยากาศบนหน้าแรก
              </p>
            </div>
          </div>

          {/* Texts Column */}
          <div className="md:col-span-7 space-y-4">
            {/* Badge & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-accent" />
                  <span>ป้ายหัวข้อ</span>
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => handleFieldChange(setBadge, e.target.value)}
                  placeholder="เช่น เรื่องเล่าจากบ้าน 100 ปี"
                  className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-accent" />
                  <span>ชื่อหัวข้อเรื่องเล่า</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleFieldChange(setTitle, e.target.value)}
                  placeholder="เช่น บ้านหลังนี้คือบ้านของครอบครัวเราจริง ๆ"
                  className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs font-bold text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
            </div>

            {/* Quote & Quote Author */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-cream/40 border border-primary/10">
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-accent" />
                  <span>คำคมประจำบ้าน 100 ปี</span>
                </label>
                <input
                  type="text"
                  value={quote}
                  onChange={(e) => handleFieldChange(setQuote, e.target.value)}
                  placeholder="เช่น “นี่คือรสมือครอบครัวเรา ไม่ได้อวดว่าเลิศที่สุด...”"
                  className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-white text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-accent" />
                  <span>ผู้กล่าวคำคม</span>
                </label>
                <input
                  type="text"
                  value={quoteAuthor}
                  onChange={(e) => handleFieldChange(setQuoteAuthor, e.target.value)}
                  placeholder="เช่น — คำของตาเงิน–ยายจัน และคนทำครัวบ้าน 100 ปี"
                  className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-white text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Story Paragraphs Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>เนื้อหาเรื่องเล่าบรรยากาศ</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-primary/60">
                  {parsedParagraphs.length} ย่อหน้า
                </span>
              </div>

              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>กดปุ่ม <kbd className="px-1 py-0.2 bg-white rounded font-mono text-[10px]">Enter</kbd> 2 ครั้งเพื่อเว้นบรรทัดแยกย่อหน้าใหม่</span>
              </div>

              <textarea
                rows={6}
                value={storyText}
                onChange={(e) => handleFieldChange(setStoryText, e.target.value)}
                placeholder="พิมพ์เนื้อเรื่องเล่าเกี่ยวกับบ้าน..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-primary/20 bg-cream/30 text-xs leading-relaxed text-primary focus:outline-hidden focus:ring-2 focus:ring-accent font-sans"
                required
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกรูปภาพและคำอธิบายเรื่องเล่าสำเร็จแล้ว!</span>
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
              <span>คืนค่าข้อความเริ่มต้น</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "กำลังบันทึก..." : "💾 บันทึกรูปภาพและเรื่องเล่า"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
