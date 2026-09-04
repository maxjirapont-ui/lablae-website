"use client";
import React, { useState, useMemo, useEffect } from "react";
import { MenuItem } from "@/lib/data";
import { Search, Info, Sparkles, Utensils } from "lucide-react";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) {
        const decoded = decodeURIComponent(cat);
        setSelectedCategory(decoded);
      }
    }
  }, []);

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
      <div key={item.id} className="flex gap-4 items-start py-4 first:pt-0 last:pb-0 font-thai">
        {item.image_url && item.image_url.trim() !== "" && (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-primary/5 shadow-sm bg-cream">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-[9px] sm:text-[10px] text-white font-bold bg-primary px-1.5 py-0.5 rounded">หมด</span>
              </div>
            )}
          </div>
        )}
        <div className="flex-grow min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className={`font-bold text-sm sm:text-base text-primary flex flex-wrap items-center gap-1.5 ${isOutOfStock ? 'opacity-50' : ''}`}>
              <span>{item.name}</span>
              {item.is_recommended === 1 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-normal">
                  <Sparkles className="w-2.5 h-2.5" /> แนะนำ
                </span>
              )}
              {item.is_seasonal === 1 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-normal">
                  ตามฤดูกาล
                </span>
              )}
              {isOutOfStock && (
                <span className="text-[9px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-normal">
                  หมดชั่วคราว
                </span>
              )}
            </h4>
            <div className="flex-grow border-b border-dotted border-primary/20 min-w-[12px] h-1 self-center" style={{ transform: 'translateY(4px)' }} />
            <span className="font-bold text-sm sm:text-base text-accent-dark shrink-0">
              {item.price > 0 ? `฿${item.price}` : "ราคาตามน้ำหนัก"}
            </span>
          </div>
          {item.description && (
            <p className="text-xs text-primary/70 mt-1 leading-relaxed line-clamp-2">
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
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-cream/70 p-4 border border-primary/5 rounded-2xl">
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/45">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาเมนูอาหาร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-primary/10 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
            />
          </div>

          {/* Info */}
          <div className="flex items-center text-xs text-primary/60 gap-1.5 self-end md:self-auto">
            <Info className="w-3.5 h-3.5" />
            <span>แสดงทั้งหมด {filteredItems.length} รายการ</span>
          </div>
        </div>
      )}

      {/* Category Tabs (Horizontal Scrollable) */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-primary/10">
        {categoryGroups.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedCategory(group)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === group
                ? "bg-primary text-white shadow-sm"
                : "bg-cream border border-primary/5 text-primary/80 hover:bg-primary/5 hover:text-accent"
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
                      <h3 className="font-bold text-sm sm:text-base text-primary px-3.5 py-1.5 bg-accent/15 rounded-xl shrink-0">
                        {group}
                      </h3>
                      <div className="flex-grow h-px bg-primary/10" />
                    </div>
                    <div className="divide-y divide-primary/5 bg-cream/35 p-5 sm:p-7 rounded-3xl border border-primary/5">
                      {items.map((item) => renderClassicItem(item))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="divide-y divide-primary/5 bg-cream/35 p-5 sm:p-7 rounded-3xl border border-primary/5">
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
                  className={`wood-card rounded-2xl overflow-hidden flex flex-col justify-between h-full bg-cream relative ${
                    isOutOfStock ? "opacity-60 border-gray-300" : ""
                  }`}
                >
                  {/* Out of Stock Label */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-primary-dark/10 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                      <span className="bg-primary/95 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg font-thai border border-accent/25">
                        ของหมดชั่วคราว
                      </span>
                    </div>
                  )}

                  {/* Menu Item Image or Decorative Accent Header */}
                  {item.image_url && item.image_url.trim() !== "" ? (
                    <div className="relative h-44 w-full overflow-hidden border-b border-primary/5">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-full bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 border-b border-primary/5 flex items-center justify-between px-4">
                      <span className="text-[10px] font-bold text-accent-dark tracking-wide font-thai">
                        สำรับลับแล
                      </span>
                      <Utensils className="w-3.5 h-3.5 text-primary/30" />
                    </div>
                  )}

                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      {/* Category pill */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent-dark text-[10px] font-semibold">
                          {getGroupForCategory(item.category)}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.is_recommended === 1 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold">
                              ★ แนะนำ
                            </span>
                          )}
                          {item.is_seasonal === 1 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
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
                        <p className="text-xs text-primary/70 line-clamp-3 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t border-primary/5">
                      <span className="text-xs text-primary/60">ราคา</span>
                      <span className="font-bold text-base sm:text-lg text-accent-dark">
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
        <div className="text-center py-16 bg-cream/40 rounded-2xl border border-dashed border-primary/10">
          <p className="text-primary/70 font-semibold text-sm">ไม่พบรายการอาหารที่ตรงกับการค้นหา</p>
        </div>
      )}
    </div>
  );
}
