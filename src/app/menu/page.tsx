import React from "react";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { getMenuItems, getSetting } from "@/lib/data";
import MenuList from "@/components/MenuList";
import VisitQuestions from "@/components/VisitQuestions";
import { Sparkles, FileText, AlertCircle, Calendar, MapPin } from "lucide-react";

export const revalidate = 0; // Disable static cache for menu, so dashboard updates show instantly

export const metadata = pageMetadata(
  "เมนูและราคาอาหาร ขันโตก อาหารพื้นเมืองลับแล",
  "ดูรูปอาหาร ราคา และรายการในชุดขันโตกของร้านลำลำลับแลบ้าน 100 ปี อุตรดิตถ์ มีข้าวพันผัก น้ำพริก และกับข้าวพื้นเมือง พร้อมแผนที่และจองโต๊ะล่วงหน้า",
  "/menu",
);

export default async function MenuPage() {
  const menuItems = await getMenuItems();

  const showHeader = (await getSetting("menu_page_header_show")) !== "0"; // default true
  const showSearch = (await getSetting("menu_page_search_show")) !== "0"; // default true
  const layoutStyle = (await getSetting("menu_page_layout")) || "grid"; // default grid
  const categoriesOrder = (await getSetting("menu_categories_order")) || "เซตขันโตก,ของทอด/ย่าง,ลาบ/แกง,น้ำพริก / เครื่องเคียง,ส้มตำบ้าน 100 ปี,ข้าวพันผัก,เครื่องดื่มและน้ำสมุนไพร,ข้าวและเส้น,อาหารพื้นบ้าน,จานเดียว,กับข้าว,เครื่องดื่ม";

  // Dynamic texts and PDF URL
  const badge = (await getSetting("menu_page_badge")) || "ร้านลำลำลับแลบ้าน 100 ปี";
  const savedTitle = await getSetting("menu_page_title");
  const title = !savedTitle || savedTitle === "กับข้าวและสำรับอาหาร"
    ? "เมนูอาหารและราคา"
    : savedTitle;
  const subtitle = (await getSetting("menu_page_subtitle")) || "ปรุงสดใหม่ทุกจาน พริกแกงทำเอง วัตถุดิบสดจากสวนหลังบ้านและในชุมชนลับแล";
  const notice = (await getSetting("menu_page_notice")) || "";
  const pdfUrl = (await getSetting("menu_pdf_url")) || "/menu-2026.pdf";
  const pdfBtnText = (await getSetting("menu_pdf_btn_text")) || "เปิดดูเล่มเมนูฉบับเต็ม (PDF)";
  const showPdf = (await getSetting("menu_pdf_show")) !== "0";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
      {/* Header */}
      {!showHeader && <h1 className="sr-only">เมนูอาหารและราคา ร้านลำลำลับแลบ้าน 100 ปี</h1>}
      {showHeader && (
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-xs font-thai font-medium border border-accent/20">
            <Sparkles className="w-3.5 h-3.5" />
            {badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-thai text-primary">
            {title}
          </h1>
          <p className="font-thai text-sm sm:text-base text-primary/70 max-w-xl mx-auto">
            {subtitle}
          </p>
          <p className="font-thai text-sm text-primary/85 max-w-xl mx-auto leading-relaxed">
            ราคาขันโตกเป็นราคาต่อชุด ดูรายการอาหารที่รวมในแต่ละชุดด้านล่างครับ
          </p>

          {notice && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-accent/10 border border-accent/25 text-xs text-accent-dark font-thai font-medium max-w-lg mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0 text-accent" />
              <span>{notice}</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/#booking"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent hover:bg-accent-dark text-primary-dark font-thai font-bold text-xs transition-all hover:scale-[1.02] shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>จองโต๊ะอาหารล่วงหน้า</span>
            </Link>

            <Link
              href="/directions"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-accent/30 text-primary font-thai font-semibold text-xs hover:bg-accent/10 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>แผนที่และเส้นทางมาร้าน</span>
            </Link>

            {showPdf && pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 text-primary border border-primary/15 text-xs font-thai font-semibold transition-all hover:scale-[1.02] shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-accent-dark" />
                <span>{pdfBtnText}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Interactive Menu List with Filtering */}
      <MenuList 
        initialItems={menuItems} 
        layoutStyle={layoutStyle} 
        showSearch={showSearch} 
        categoriesOrder={categoriesOrder}
      />

      <VisitQuestions kind="menu" />

      <section className="border-t border-accent/20 pt-8 font-thai space-y-3">
        <h2 className="text-xl font-bold text-primary">เรื่องอาหารและบ้านของเรา</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-accent">
          <Link href="/blog/chapter-22-khao-phan-phak" className="underline underline-offset-4">อ่านเรื่องข้าวพันผักเมืองลับแล</Link>
          <Link href="/about" className="underline underline-offset-4">รู้จักบ้าน 100 ปี</Link>
          <Link href="/lablae" className="underline underline-offset-4">รู้จักเมืองลับแล อุตรดิตถ์</Link>
        </div>
      </section>
    </div>
  );
}
