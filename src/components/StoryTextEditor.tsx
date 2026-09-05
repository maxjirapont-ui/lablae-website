"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  RotateCcw,
  FileText,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Quote,
  Hash,
  Tag,
  Type,
} from "lucide-react";
import { DEFAULT_STORIES } from "./QuickFactsStoryModal";

export interface StoryTextFields {
  stat: string;
  statLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  quote: string;
  quoteAuthor: string;
  paragraphs: string[];
}

interface StoryTextEditorProps {
  storyId: "house" | "wood" | "family" | "kitchen";
  storyEmoji: string;
  storyTabName: string;
  currentCustomData?: Partial<StoryTextFields> & { photos?: unknown[] };
  onSave: (fields: StoryTextFields) => Promise<void>;
  onReset: () => Promise<void>;
  isLoading: boolean;
}

export default function StoryTextEditor({
  storyId,
  storyEmoji,
  storyTabName,
  currentCustomData,
  onSave,
  onReset,
  isLoading,
}: StoryTextEditorProps) {
  const defaultStory = DEFAULT_STORIES.find((s) => s.id === storyId);

  // Derive initial values: custom data overrides default values
  const getInitialStat = () => currentCustomData?.stat !== undefined ? currentCustomData.stat : (defaultStory?.stat || "");
  const getInitialStatLabel = () => currentCustomData?.statLabel !== undefined ? currentCustomData.statLabel : (defaultStory?.statLabel || "");
  const getInitialBadge = () => currentCustomData?.badge !== undefined ? currentCustomData.badge : (defaultStory?.badge || "");
  const getInitialTitle = () => currentCustomData?.title !== undefined ? currentCustomData.title : (defaultStory?.title || "");
  const getInitialSubtitle = () => currentCustomData?.subtitle !== undefined ? currentCustomData.subtitle : (defaultStory?.subtitle || "");
  const getInitialQuote = () => currentCustomData?.quote !== undefined ? currentCustomData.quote : (defaultStory?.quote || "");
  const getInitialQuoteAuthor = () => currentCustomData?.quoteAuthor !== undefined ? currentCustomData.quoteAuthor : (defaultStory?.quoteAuthor || "");
  const getInitialParagraphs = () => {
    if (currentCustomData?.paragraphs) {
      if (Array.isArray(currentCustomData.paragraphs)) {
        return currentCustomData.paragraphs.join("\n\n");
      }
      if (typeof currentCustomData.paragraphs === "string") {
        return currentCustomData.paragraphs;
      }
    }
    return defaultStory?.paragraphs ? defaultStory.paragraphs.join("\n\n") : "";
  };

  const [stat, setStat] = useState(getInitialStat);
  const [statLabel, setStatLabel] = useState(getInitialStatLabel);
  const [badge, setBadge] = useState(getInitialBadge);
  const [title, setTitle] = useState(getInitialTitle);
  const [subtitle, setSubtitle] = useState(getInitialSubtitle);
  const [quote, setQuote] = useState(getInitialQuote);
  const [quoteAuthor, setQuoteAuthor] = useState(getInitialQuoteAuthor);
  const [paragraphsText, setParagraphsText] = useState(getInitialParagraphs);

  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Check if any custom text is stored in database
  const hasCustomText = Boolean(
    currentCustomData &&
      (currentCustomData.stat !== undefined ||
        currentCustomData.statLabel !== undefined ||
        currentCustomData.badge !== undefined ||
        currentCustomData.title !== undefined ||
        currentCustomData.subtitle !== undefined ||
        currentCustomData.quote !== undefined ||
        currentCustomData.quoteAuthor !== undefined ||
        currentCustomData.paragraphs !== undefined)
  );

  // Sync state if storyId or currentCustomData changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Reset the draft when the selected story changes. */
    setStat(getInitialStat());
    setStatLabel(getInitialStatLabel());
    setBadge(getInitialBadge());
    setTitle(getInitialTitle());
    setSubtitle(getInitialSubtitle());
    setQuote(getInitialQuote());
    setQuoteAuthor(getInitialQuoteAuthor());
    setParagraphsText(getInitialParagraphs());
    setIsDirty(false);
    setSaveSuccess(false);
    setErrorMessage("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storyId, currentCustomData]);

  // Compute paragraph count
  const parsedParagraphs = paragraphsText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setIsDirty(true);
    setSaveSuccess(false);
    setErrorMessage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const finalParagraphs =
      parsedParagraphs.length > 0
        ? parsedParagraphs
        : paragraphsText.trim().length > 0
        ? [paragraphsText.trim()]
        : [];

    try {
      await onSave({
        stat: stat.trim(),
        statLabel: statLabel.trim(),
        badge: badge.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        quote: quote.trim(),
        quoteAuthor: quoteAuthor.trim(),
        paragraphs: finalParagraphs,
      });

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        `คุณต้องการคืนค่าข้อความเริ่มต้นของ "${defaultStory?.title || storyTabName}" หรือไม่?\n(หมายเหตุ: รูปภาพที่อัปโหลดไว้จะไม่ถูกลบ)`
      )
    ) {
      return;
    }

    await onReset();
    if (defaultStory) {
      setStat(defaultStory.stat || "");
      setStatLabel(defaultStory.statLabel || "");
      setBadge(defaultStory.badge || "");
      setTitle(defaultStory.title || "");
      setSubtitle(defaultStory.subtitle || "");
      setQuote(defaultStory.quote || "");
      setQuoteAuthor(defaultStory.quoteAuthor || "");
      setParagraphsText(defaultStory.paragraphs ? defaultStory.paragraphs.join("\n\n") : "");
    }
    setIsDirty(false);
    setSaveSuccess(false);
  };

  return (
    <div className="border border-primary/10 rounded-2xl bg-white p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Header of Text Editor */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-primary/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{storyEmoji}</span>
            <h4 className="font-bold text-sm sm:text-base text-primary">
              แก้ไขข้อความ & เรื่องเล่า ({storyTabName})
            </h4>
            {hasCustomText ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 text-[10px] font-bold">
                ✏️ ใช้ข้อความที่กำหนดเอง
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary/70 text-[10px] font-medium">
                🏛️ ใช้ข้อความมาตรฐาน
              </span>
            )}
          </div>
          <p className="text-xs text-primary/60 mt-1">
            แก้ไขข้อมูลสถิติ ชื่อเรื่อง คำโปรย คำคม และเนื้อเรื่องประวัติให้ตรงกับความเป็นจริง
          </p>
        </div>

        {/* Live Preview Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/15 text-xs font-semibold text-primary/80 hover:bg-cream hover:text-primary transition-colors cursor-pointer"
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
      </div>

      {/* Live Preview Box */}
      {showPreview && (
        <div className="p-5 rounded-2xl bg-[#1f140e] border border-accent/30 text-[#f7eee3] space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-accent/20 pb-2">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent" />
              ตัวอย่างการแสดงผลบนหน้าเว็บ (Live Preview)
            </span>
            <span className="text-[10px] text-accent/60">อัปเดตแบบเรียลไทม์</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Mini Card Preview */}
            <div className="p-4 rounded-xl bg-[#2a1a12] border border-accent/20 text-center flex flex-col items-center">
              <span className="text-xs font-bold text-accent/70 mb-2">การ์ดหน้าแรก</span>
              <span className="text-2xl mb-1">{storyEmoji}</span>
              <p className="font-bold text-accent text-base">{stat || "—"}</p>
              <p className="text-xs text-[#f7eee3]/75 mt-0.5">{statLabel || "—"}</p>
            </div>

            {/* Modal Header & Quote Preview */}
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                  {badge || "มรดก"}
                </span>
                <span className="text-xs font-bold text-accent">{stat}</span>
              </div>
              <h5 className="font-bold text-base text-[#f7eee3] leading-snug">
                {title || "ชื่อหัวข้อเรื่อง"}
              </h5>
              {subtitle && (
                <p className="text-xs text-accent/90 italic font-serif">
                  {subtitle}
                </p>
              )}
              {quote && (
                <div className="p-2.5 rounded-xl bg-accent/10 border-l-2 border-accent text-xs italic text-accent/90">
                  {quote}
                  {quoteAuthor && (
                    <span className="block not-italic text-[10px] text-[#f7eee3]/60 mt-1 text-right">
                      — {quoteAuthor}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Paragraphs preview */}
          {parsedParagraphs.length > 0 && (
            <div className="pt-2 border-t border-accent/15 space-y-2">
              <span className="text-[11px] font-bold text-accent/80">
                เนื้อเรื่อง ({parsedParagraphs.length} ย่อหน้า):
              </span>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2 text-xs leading-relaxed text-[#f7eee3]/80">
                {parsedParagraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Row 1: Stat Number, Stat Label, Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-accent" />
              <span>ตัวเลขสถิติบนการ์ด</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={stat}
              onChange={(e) => handleFieldChange(setStat, e.target.value)}
              placeholder="เช่น ๑๐๐+ ปี, ๐ ตัว, ๔ รุ่นคน"
              className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs font-bold text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
              required
            />
            <p className="text-[10px] text-primary/50">ตัวอักษรเด่นขนาดใหญ่บนการ์ดหน้าแรก</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-accent" />
              <span>คำอธิบายสถิติ</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={statLabel}
              onChange={(e) => handleFieldChange(setStatLabel, e.target.value)}
              placeholder="เช่น อายุเรือนไม้สักทอง, ไร้ตะปู เข้าเดือยไม้"
              className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
              required
            />
            <p className="text-[10px] text-primary/50">บรรทัดที่สองใต้ตัวเลขสถิติ</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>ป้ายกำกับหมวด</span>
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => handleFieldChange(setBadge, e.target.value)}
              placeholder="เช่น มรดกสถาปัตยกรรม, ภูมิปัญญาช่างโบราณ"
              className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
            <p className="text-[10px] text-primary/50">ป้ายหัวเรื่องเล็กๆ บนกล่องเนื้อหา</p>
          </div>
        </div>

        {/* Row 2: Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-accent" />
            <span>ชื่อหัวข้อเรื่องหลัก (Title)</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleFieldChange(setTitle, e.target.value)}
            placeholder="เช่น เรือนไม้สักทองโบราณ ๑๐๐+ ปี (เรือนหม่อนน้อย)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-primary/20 bg-cream/30 text-xs font-bold text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        {/* Row 3: Subtitle */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-primary flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>คำโปรยใต้หัวข้อ (Subtitle)</span>
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => handleFieldChange(setSubtitle, e.target.value)}
            placeholder="เช่น บ้านไม้สองชั้นหลังใหญ่ ยุคพระศรีพนมมาศวางผังเมืองลับแล"
            className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Row 4: Quote & Author */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-accent" />
              <span>คำคมหรือคำพูดประจำเรื่อง (Quote)</span>
            </label>
            <input
              type="text"
              value={quote}
              onChange={(e) => handleFieldChange(setQuote, e.target.value)}
              placeholder="เช่น “นี่ไม่ใช่แค่ร้านอาหาร แต่คือบ้านจริงๆ ของครอบครัวเรา...”"
              className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-accent" />
              <span>ผู้กล่าวคำคม (Quote Author)</span>
            </label>
            <input
              type="text"
              value={quoteAuthor}
              onChange={(e) => handleFieldChange(setQuoteAuthor, e.target.value)}
              placeholder="เช่น ลูกหลานรุ่น ๔ ผู้ดูแลเรือน"
              className="w-full px-3.5 py-2 rounded-xl border border-primary/20 bg-cream/30 text-xs text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Row 5: Paragraphs Multiline Textarea */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>เนื้อเรื่องประวัติ / เรื่องเล่าฉบับเต็ม</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3 text-[11px] text-primary/60">
              <span>{parsedParagraphs.length} ย่อหน้า</span>
              <span>•</span>
              <span>{paragraphsText.length} ตัวอักษร</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>คำแนะนำ:</strong> พิมพ์หรือวางเรื่องเล่าได้ตามต้องการ หากต้องการแยกย่อหน้า ให้กดปุ่ม{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono text-[10px]">
                Enter
              </kbd>{" "}
              2 ครั้งเพื่อเว้น 1 บรรทัดว่าง ระบบจะแยกเป็นย่อหน้าให้อัตโนมัติ
            </span>
          </div>

          <textarea
            rows={10}
            value={paragraphsText}
            onChange={(e) => handleFieldChange(setParagraphsText, e.target.value)}
            placeholder="พิมพ์เรื่องราวประวัติที่แท้จริงได้ที่นี่..."
            className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-cream/30 text-xs text-primary leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-accent font-sans"
            required
          />
        </div>

        {/* Action Buttons & Status */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-primary/10">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกข้อความเรื่องเล่าสำเร็จแล้ว!</span>
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
            {/* Reset to default button */}
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-primary/20 text-xs font-semibold text-primary/70 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer disabled:opacity-50"
              title="คืนค่าข้อความเริ่มต้นเป็นข้อมูลตั้งต้นของระบบ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าข้อความเริ่มต้น</span>
            </button>

            {/* Save button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "กำลังบันทึก..." : "💾 บันทึกการแก้ไขเรื่องนี้"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
