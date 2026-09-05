import React from "react";
import Link from "next/link";
import { getMenuItems, getSetting } from "@/lib/data";
import MenuList from "@/components/MenuList";
import { Sparkles, FileText, AlertCircle, Calendar } from "lucide-react";

export const revalidate = 0; // Disable static cache for menu, so dashboard updates show instantly

export const metadata = {
  title: "กับข้าวและสำรับอาหาร | ร้านลำลำลับแลบ้าน ๑๐๐ ปี",
  description: "เมนูอาหารเหนือแบบลับแล ขันโตก น้ำพริกหนุ่ม น้ำพริกอ่อง ข้าวพันผัก และอาหารพื้นบ้านสูตรโบราณ ๔ รุ่น",
};

export default async function MenuPage() {
  const menuItems = await getMenuItems();

  const showHeader = (await getSetting("menu_page_header_show")) !== "0"; // default true
  const showSearch = (await getSetting("menu_page_search_show")) !== "0"; // default true
  const layoutStyle = (await getSetting("menu_page_layout")) || "grid"; // default grid
  const categoriesOrder = (await getSetting("menu_categories_order")) || "เซตขันโตก,ของทอด/ย่าง,ลาบ/แกง,น้ำพริก / เครื่องเคียง,ส้มตำบ้าน 100 ปี,ข้าวพันผัก,เครื่องดื่มและน้ำสมุนไพร,ข้าวและเส้น,อาหารพื้นบ้าน,จานเดียว,กับข้าว,เครื่องดื่ม";

  // Dynamic texts and PDF URL
  const badge = (await getSetting("menu_page_badge")) || "ร้านลำลำลับแลบ้าน ๑๐๐ ปี";
  const title = (await getSetting("menu_page_title")) || "กับข้าวและสำรับอาหาร";
  const subtitle = (await getSetting("menu_page_subtitle")) || "ปรุงสดใหม่ทุกจาน พริกแกงโขลกเอง วัตถุดิบสดจากสวนหลังบ้านและในชุมชนลับแล";
  const notice = (await getSetting("menu_page_notice")) || "";
  const pdfUrl = (await getSetting("menu_pdf_url")) || "/menu-2026.pdf";
  const pdfBtnText = (await getSetting("menu_pdf_btn_text")) || "เปิดดูเล่มเมนูฉบับเต็ม (PDF)";
  const showPdf = (await getSetting("menu_pdf_show")) !== "0";

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
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
    </div>
  );
}
