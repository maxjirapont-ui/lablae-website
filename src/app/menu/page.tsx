import React from "react";
import { getMenuItems, getSetting } from "@/lib/data";
import MenuList from "@/components/MenuList";
import { Sparkles, FileText } from "lucide-react";

export const revalidate = 0; // Disable static cache for menu, so dashboard updates show instantly

export default async function MenuPage() {
  const menuItems = await getMenuItems();

  const showHeader = (await getSetting("menu_page_header_show")) !== "0"; // default true
  const showSearch = (await getSetting("menu_page_search_show")) !== "0"; // default true
  const layoutStyle = (await getSetting("menu_page_layout")) || "grid"; // default grid
  const categoriesOrder = (await getSetting("menu_categories_order")) || "เซทขันโตก,ของทอด/ย่าง,ลาบ/แกง,น้ำพริก / เครื่องเคียง,ส้มตำบ้าน 100 ปี,ข้าวพันผัก,เครื่องดื่มดับแซ่บ & น้ำสมุนไพร,ข้าวและเส้น,อาหารพื้นบ้าน,จานเดียว,กับข้าว,เครื่องดื่ม";

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      {showHeader && (
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-xs font-thai font-medium border border-accent/20">
            <Sparkles className="w-3.5 h-3.5" />
            ร้านลำลำลับแลบ้าน ๑๐๐ ปี
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-thai text-primary">
            กับข้าวและสำรับอาหาร
          </h1>
          <p className="font-thai text-sm sm:text-base text-primary/70 max-w-xl mx-auto">
            ปรุงสดใหม่ทุกจาน พริกแกงโขลกเอง วัตถุดิบสดจากสวนหลังบ้านและในชุมชนลับแล
          </p>
          <div className="pt-2 flex justify-center">
            <a
              href="/menu-2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 text-primary border border-primary/15 text-xs font-thai font-semibold transition-all hover:scale-[1.02] shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-accent-dark" />
              <span>เปิดดูเล่มเมนูฉบับเต็ม (PDF)</span>
            </a>
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
