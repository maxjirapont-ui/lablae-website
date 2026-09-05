"use client";
import React, { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MenuItem } from "@/lib/data";
import { Search, Info, Sparkles, Utensils, UtensilsCrossed } from "lucide-react";

interface MenuListProps {
  initialItems: MenuItem[];
  layoutStyle?: string;
  showSearch?: boolean;
  categoriesOrder?: string;
}

export default function MenuList({
  initialItems,
  layoutStyle = "grid",
  showSearch = true,
  categoriesOrder = "เซทขันโตก,ของทอด/ย่าง,ลาบ/แกง,น้ำพริก / เครื่องเคียง,ส้มตำบ้าน 100 ปี,ข้าวพันผัก,เครื่องดื่มดับแซ่บ & น้ำสมุนไพร,ข้าวและเส้น,อาหารพื้นบ้าน,จานเดียว,กับข้าว,เครื่องดื่ม",
}: MenuListProps) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const category = searchParams.get("category");
    return category ? decodeURIComponent(category) : "ทั้งหมด";
  });
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Map database categories into user-friendly grouped categories based on user customization order
  const categoryGroups = useMemo(() => {
    const list = categoriesOrder
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    return ["ทั้งหมด", "เมนูแนะนำ", "อาหารตามฤดูกาล", ...list];
  }, [categoriesOrder]);

  const getGroupForCategory = (dbCategory: string): string => {
    const cat = dbCategory.trim();
    if (cat.includes("ขันโตก")) return "เซทขันโตก";
    if (cat.includes("ของทอด") || cat.includes("ย่าง")) return "ของทอด/ย่าง";
    if (cat.includes("ลาบ") || cat.includes("แกง")) return "ลาบ/แกง";
    if (cat.includes("น้ำพริก") || cat.includes("เครื่องเคียง")) return "น้ำพริก / เครื่องเคียง";
    if (cat.includes("ส้มตำ")) return "ส้มตำบ้าน 100 ปี";
    if (cat.includes("ข้าวพันผัก") || cat.includes("ข้าวแคบ")) return "ข้าวพันผัก";
    if (cat.includes("ดับแซ่บ") || cat.includes("สมุนไพร")) return "เครื่องดื่มดับแซ่บ & น้ำสมุนไพร";
    if (cat.includes("ข้าวและเส้น") || cat.includes("ท๊อปปิ้ง")) return "ข้าวและเส้น";
    if (cat.includes("อาหารพื้นบ้าน") || cat.includes("อาหารถิ่น")) return "อาหารพื้นบ้าน";
    if (cat.includes("จานเดียว") || cat.includes("จานยักษ์")) return "จานเดียว";
    if (cat.includes("กับข้าว") || cat.includes("เมนูต้ม")) return "กับข้าว";
    if (cat.includes("ทานเล่น") || cat.includes("ของฝาก")) return "ของหวาน & ทานเล่น";
    if (cat.includes("เครื่องดื่ม") || cat.includes("น้ำชง")) return "เครื่องดื่ม";
    
    // Direct matches
    if (cat === "เซทขันโตก") return "เซทขันโตก";
    if (cat === "ของทอด/ย่าง") return "ของทอด/ย่าง";
    if (cat === "ลาบ/แกง") return "ลาบ/แกง";
    if (cat === "น้ำพริก / เครื่องเคียง") return "น้ำพริก / เครื่องเคียง";
    if (cat === "ส้มตำบ้าน 100 ปี") return "ส้มตำบ้าน 100 ปี";
    if (cat === "ข้าวพันผัก") return "ข้าวพันผัก";
    if (cat === "เครื่องดื่มดับแซ่บ & น้ำสมุนไพร") return "เครื่องดื่มดับแซ่บ & น้ำสมุนไพร";
    if (cat === "ข้าวและเส้น") return "ข้าวและเส้น";
    return "กับข้าว"; // Fallback default
  };

  // Filter items based on selected category and search query
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedCategory === "ทั้งหมด") {
        return true;
      }
      if (selectedCategory === "เมนูแนะนำ") {
        return !!item.is_recommended;
      }
      if (selectedCategory === "อาหารตามฤดูกาล") {
        return !!item.is_seasonal;
      }
      
      const itemGroup = getGroupForCategory(item.category);
      return itemGroup === selectedCategory;
    });
  }, [initialItems, selectedCategory, searchQuery]);

  // Group items by category (used for classic list layout when showing all categories)
  const groupedByCategory = useMemo(() => {
    const groups: { [key: string]: MenuItem[] } = {};
    categoryGroups.forEach((g) => {
      if (g !== "ทั้งหมด") groups[g] = [];
    });

    initialItems.forEach((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (matchesSearch) {
        const itemGroup = getGroupForCategory(item.category);
        if (groups[itemGroup]) {
          groups[itemGroup].push(item);
        }
        
        if (item.is_recommended && groups["เมนูแนะนำ"]) {
          groups["เมนูแนะนำ"].push(item);
        }
        if (item.is_seasonal && groups["อาหารตามฤดูกาล"]) {
          groups["อาหารตามฤดูกาล"].push(item);
        }
      }
    });
    return groups;
  }, [initialItems, searchQuery, categoryGroups]);

  // Render method for classic items
  const renderClassicItem = (item: MenuItem) => {
    const isOutOfStock = item.available === 0;
    return (
      <div
        key={item.id}
        className="flex gap-3.5 sm:gap-4 items-start p-4 rounded-2xl bg-[#241710] border border-accent/20 hover:border-accent/45 shadow-xs hover:shadow-md transition-all font-thai group"
      >
        {item.image_url && item.image_url.trim() !== "" ? (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-accent/20 shadow-xs bg-[#1a100a]">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-[9px] sm:text-[10px] text-white font-bold bg-rose-900 px-1.5 py-0.5 rounded">หมด</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-accent/15 bg-[#1f140e] flex items-center justify-center text-accent/40">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
        )}
        <div className="flex-grow min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className={`font-bold text-sm sm:text-base text-[#f7eee3] flex flex-wrap items-center gap-1.5 ${isOutOfStock ? 'opacity-50' : ''}`}>
              <span>{item.name}</span>
              {item.is_recommended === 1 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-300 bg-amber-950/70 border border-amber-600/40 px-1.5 py-0.5 rounded-full font-normal">
                  <Sparkles className="w-2.5 h-2.5" /> แนะนำ
                </span>
              )}
              {item.is_seasonal === 1 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-300 bg-emerald-950/70 border border-emerald-600/40 px-1.5 py-0.5 rounded-full font-normal">
                  ตามฤดูกาล
                </span>
              )}
              {isOutOfStock && (
                <span className="text-[9px] text-rose-300 bg-rose-950/70 border border-rose-600/40 px-1.5 py-0.5 rounded font-normal">
                  หมดชั่วคราว
                </span>
              )}
            </h4>
            <div className="flex-grow border-b border-dotted border-accent/25 min-w-[12px] h-1 self-center" style={{ transform: 'translateY(4px)' }} />
            <span className="font-bold text-sm sm:text-base text-accent shrink-0">
              {item.price > 0 ? `฿${item.price}` : "ราคาตามน้ำหนัก"}
            </span>
          </div>
          {item.description && (
            <p className="text-xs text-[#f7eee3]/70 mt-1 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 font-thai">
      {/* Search & Category Filter Controls */}
      {showSearch && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#261810] p-4 border border-accent/20 rounded-2xl">
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-accent/60">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาเมนูอาหาร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-accent/20 rounded-xl bg-[#1a100a] text-[#f5ece1] placeholder-[#c8b39b]/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
            />
          </div>

          {/* Info */}
          <div className="flex items-center text-xs text-[#f5ece1]/70 gap-1.5 self-end md:self-auto">
            <Info className="w-3.5 h-3.5 text-accent" />
            <span>แสดงทั้งหมด {filteredItems.length} รายการ</span>
          </div>
        </div>
      )}

      {/* First-Timer Recommendation Banner */}
      <div 
        onClick={() => setSelectedCategory("เมนูแนะนำ")}
        className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-accent/15 via-[#261810] to-accent/15 border border-accent/30 flex items-center justify-between gap-3 cursor-pointer hover:border-accent transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg shrink-0">⭐</span>
          <p className="text-xs sm:text-sm text-[#f7eee3] truncate font-medium">
            <strong className="text-accent">มาครั้งแรกสั่งอะไรดี?</strong> แนะนำ: ชุดขันโตกบ้าน ๑๐๐ ปี, หมูทอดลับแลพริกข่า, ข้าวพันผัก, อ่องมันปู
          </p>
        </div>
        <span className="text-[11px] font-bold text-accent shrink-0 group-hover:underline flex items-center gap-1">
          ดูเมนูแนะนำ →
        </span>
      </div>

      {/* Category Tabs (Horizontal Scrollable) */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-accent/20">
        {categoryGroups.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedCategory(group)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === group
                ? "bg-accent text-[#1c120c] font-bold shadow-md"
                : "bg-[#261810] border border-accent/20 text-[#f5ece1]/80 hover:bg-accent/15 hover:text-accent"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Menu List/Grid Container */}
      {filteredItems.length > 0 ? (
        layoutStyle === "classic" ? (
          <div className="space-y-8">
            {selectedCategory === "ทั้งหมด" ? (
              categoryGroups.map((group) => {
                if (group === "ทั้งหมด") return null;
                const items = groupedByCategory[group] || [];
                if (items.length === 0) return null;
                return (
                  <div key={group} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="font-bold text-sm sm:text-base text-accent px-4 py-1.5 bg-[#261810] border border-accent/25 rounded-xl shrink-0">
                        {group} ({items.length})
                      </h3>
                      <div className="flex-grow h-px bg-accent/20" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                      {items.map((item) => renderClassicItem(item))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {filteredItems.map((item) => renderClassicItem(item))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const isOutOfStock = item.available === 0;
              return (
                <div
                  key={item.id}
                  className={`wood-card rounded-2xl overflow-hidden flex flex-col justify-between h-full bg-[#261810] border border-accent/20 relative ${
                    isOutOfStock ? "opacity-60 border-stone-700" : ""
                  }`}
                >
                  {/* Out of Stock Label */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                      <span className="bg-[#1c120c]/95 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg font-thai border border-accent/40">
                        ของหมดชั่วคราว
                      </span>
                    </div>
                  )}

                  {/* Menu Item Image or Decorative Accent Header */}
                  {item.image_url && item.image_url.trim() !== "" ? (
                    <div className="relative h-44 w-full overflow-hidden border-b border-accent/15">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-full bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 border-b border-accent/15 flex items-center justify-between px-4">
                      <span className="text-[10px] font-bold text-accent tracking-wide font-thai">
                        สำรับลับแล
                      </span>
                      <Utensils className="w-3.5 h-3.5 text-accent/40" />
                    </div>
                  )}

                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      {/* Category pill */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold border border-accent/25">
                          {getGroupForCategory(item.category)}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.is_recommended === 1 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/50 text-[9px] font-bold">
                              ★ แนะนำ
                            </span>
                          )}
                          {item.is_seasonal === 1 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 text-[9px] font-bold">
                              ตามฤดูกาล
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="font-bold text-base sm:text-lg text-primary mt-3 leading-tight line-clamp-2">
                        {item.name}
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-[#f5ece1]/70 line-clamp-3 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t border-accent/15">
                      <span className="text-xs text-[#f5ece1]/60">ราคา</span>
                      <span className="font-bold text-base sm:text-lg text-accent">
                        {item.price > 0 ? `฿${item.price}` : "ราคาตามน้ำหนัก"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div
          className="text-center py-16 bg-[#261810]/60 rounded-2xl border border-dashed border-accent/20"
          aria-live="polite"
        >
          <p className="text-accent/80 font-semibold text-sm">
            {searchQuery.trim()
              ? `ไม่พบเมนูที่ตรงกับ “${searchQuery.trim()}”`
              : selectedCategory === "ทั้งหมด"
                ? "ขณะนี้ยังไม่มีรายการอาหาร"
                : `หมวด “${selectedCategory}” ยังไม่มีรายการอาหาร`}
          </p>
        </div>
      )}
    </div>
  );
}
