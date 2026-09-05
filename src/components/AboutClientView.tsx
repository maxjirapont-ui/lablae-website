"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Home, UtensilsCrossed, BookOpen, Heart, ArrowRight, MapPin, Clock, Phone, Navigation, Scroll } from "lucide-react";
import { AboutCustomData } from "./AboutPageEditor";

interface AboutClientViewProps {
  data: AboutCustomData;
  hours: string;
  phone: string;
  address: string;
  googleMapsUrl: string;
}

export default function AboutClientView({
  data,
  hours,
  phone,
  address,
  googleMapsUrl,
}: AboutClientViewProps) {
  const [activeTab, setActiveTab] = useState<"house" | "food" | "legend">("house");

  const tabs = [
    {
      id: "house" as const,
      label: "คน ๔ รุ่นกับเรือนไม้ไร้ตะปู",
      icon: Home,
      title: data.tab1_title,
      desc: data.tab1_desc,
      content: (
        <div className="space-y-8 font-thai text-sm sm:text-base leading-relaxed text-[#f5ece1]/85">
          <p className="text-base sm:text-lg text-primary font-medium leading-relaxed">
            {data.tab1_intro}
          </p>

          {/* Timeline of 4 Generations */}
          <div className="space-y-6 relative border-l-2 border-accent/40 pl-6 ml-2 sm:ml-4">
            {/* Gen 1 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-[#1a100a]" />
              <span className="text-xs font-bold text-accent-dark tracking-wider uppercase">{data.tab1_gen1_badge}</span>
              <h4 className="font-bold text-lg text-primary">{data.tab1_gen1_name}</h4>
              <p className="text-xs sm:text-sm text-[#f5ece1]/80 leading-relaxed">
                {data.tab1_gen1_desc}
              </p>
            </div>

            {/* Guardian / Gen 2 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-[#1a100a]" />
              <span className="text-xs font-bold text-accent-dark tracking-wider uppercase">{data.tab1_gen2_badge}</span>
              <h4 className="font-bold text-lg text-primary">{data.tab1_gen2_name}</h4>
              <p className="text-xs sm:text-sm text-[#f5ece1]/80 leading-relaxed">
                {data.tab1_gen2_desc}
              </p>
            </div>

            {/* Gen 3 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-[#1a100a]" />
              <span className="text-xs font-bold text-accent-dark tracking-wider uppercase">{data.tab1_gen3_badge}</span>
              <h4 className="font-bold text-lg text-primary">{data.tab1_gen3_name}</h4>
              <p className="text-xs sm:text-sm text-[#f5ece1]/80 leading-relaxed">
                {data.tab1_gen3_desc}
              </p>
            </div>

            {/* Gen 4 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-[#1a100a]" />
              <span className="text-xs font-bold text-primary tracking-wider uppercase">{data.tab1_gen4_badge}</span>
              <h4 className="font-bold text-lg text-primary">{data.tab1_gen4_name}</h4>
              <p className="text-xs sm:text-sm text-[#f5ece1]/80 leading-relaxed">
                {data.tab1_gen4_desc}
              </p>
            </div>
          </div>

          <div className="p-6 bg-[#241710] rounded-2xl border border-accent/25 space-y-2">
            <h5 className="font-bold text-primary flex items-center gap-2 text-base">
              <Heart className="w-4 h-4 text-accent fill-current" />
              {data.tab1_quote_title}
            </h5>
            <p className="text-xs sm:text-sm text-[#f5ece1]/85 italic leading-relaxed">
              {data.tab1_quote_text}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "food" as const,
      label: "รสชาติรอยต่อวัฒนธรรม",
      icon: UtensilsCrossed,
      title: data.tab2_title,
      desc: data.tab2_desc,
      content: (
        <div className="space-y-6 font-thai text-sm sm:text-base leading-relaxed text-[#f5ece1]/85">
          <p>{data.tab2_intro}</p>

          <blockquote className="p-5 bg-[#1f140e] border-l-4 border-accent rounded-r-2xl text-base sm:text-lg font-bold text-primary italic leading-relaxed">
            {data.tab2_quote}
          </blockquote>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-5 bg-[#1f140e] border border-accent/20 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">{data.tab2_card1_title}</h4>
              <p className="text-xs text-[#f5ece1]/75 leading-relaxed">
                {data.tab2_card1_desc}
              </p>
            </div>

            <div className="p-5 bg-[#1f140e] border border-accent/20 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">{data.tab2_card2_title}</h4>
              <p className="text-xs text-[#f5ece1]/75 leading-relaxed">
                {data.tab2_card2_desc}
              </p>
            </div>

            <div className="p-5 bg-[#1f140e] border border-accent/20 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">{data.tab2_card3_title}</h4>
              <p className="text-xs text-[#f5ece1]/75 leading-relaxed">
                {data.tab2_card3_desc}
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#1f140e] rounded-2xl border border-accent/20 space-y-1">
            <h4 className="font-bold text-primary text-sm">{data.tab2_formula_title}</h4>
            <p className="text-xs sm:text-sm text-[#f5ece1]/80 leading-relaxed">
              {data.tab2_formula_desc}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "legend" as const,
      label: "ตำนานและสัจจะวาจา",
      icon: Sparkles,
      title: data.tab3_title,
      desc: data.tab3_desc,
      content: (
        <div className="space-y-6 font-thai text-sm sm:text-base leading-relaxed text-[#f5ece1]/85">
          <div className="p-5 bg-[#1f140e] border-l-4 border-accent rounded-r-2xl space-y-2">
            <h4 className="font-bold text-primary text-base">{data.tab3_legend_title}</h4>
            <p className="text-xs sm:text-sm text-[#f5ece1]/80 leading-relaxed">
              {data.tab3_legend_desc1}
            </p>
            <p className="text-xs sm:text-sm text-[#f5ece1]/80 italic pt-1 leading-relaxed">
              {data.tab3_legend_desc2}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-[#1f140e] border border-accent/20 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">{data.tab3_card1_title}</h4>
              <p className="text-xs text-[#f5ece1]/75 leading-relaxed">
                {data.tab3_card1_desc}
              </p>
            </div>

            <div className="p-5 bg-[#1f140e] border border-accent/20 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">{data.tab3_card2_title}</h4>
              <p className="text-xs text-[#f5ece1]/75 leading-relaxed">
                {data.tab3_card2_desc}
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-xs font-thai font-medium border border-accent/20">
          <Sparkles className="w-3.5 h-3.5" />
          {data.header_badge}
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-thai text-primary">
          {data.header_title}
        </h1>
        <p className="font-thai text-sm sm:text-base text-primary/70 max-w-xl mx-auto">
          {data.header_subtitle}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-primary/10 overflow-x-auto scrollbar-none gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-thai text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "border-accent text-accent bg-accent/5"
                  : "border-transparent text-primary/70 hover:text-accent hover:bg-primary/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Box */}
      <div className="wood-card bg-[#241710] border border-accent/20 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="space-y-2 border-b border-accent/15 pb-4">
          <h2 className="text-2xl font-bold font-thai text-primary">
            {currentTab.title}
          </h2>
          <p className="font-thai text-xs sm:text-sm text-accent-dark font-medium">
            {currentTab.desc}
          </p>
        </div>

        <div className="transition-all duration-300">
          {currentTab.content}
        </div>
      </div>

      {/* Link to Digital Book */}
      <div className="p-8 bg-gradient-to-r from-[#20140c] via-[#2a1a12] to-[#20140c] rounded-3xl border border-accent/20 text-center space-y-4">
        <div className="inline-flex p-3 bg-[#1a100a] rounded-2xl border border-accent/25 shadow-xs text-accent">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="font-thai font-bold text-xl sm:text-2xl text-primary">
          อ่านฉบับเต็มใน “ตำราลับแลง” ทั้ง ๓๒ ตอน
        </h3>
        <p className="font-thai text-xs sm:text-sm text-primary/70 max-w-md mx-auto">
          อ่านเรื่องราวประวัติศาสตร์ บันทึกครัวตาเงิน-ยายจัน และวิธีปรุงอาหารสูตรดั้งเดิมบนหน้าเว็บได้ฟรี
        </p>
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent hover:brightness-110 text-[#1a100a] rounded-full font-thai text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105"
          >
            <span>เปิดอ่านสารบัญตำราลับแลง</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Map & Directions Section */}
      <div id="directions" className="scroll-mt-24 p-8 sm:p-10 wood-card bg-[#241710] rounded-3xl border border-accent/20 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/20 text-accent-dark rounded-2xl">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-thai font-bold text-xl sm:text-2xl text-primary">
              เส้นทางมาร้านและแผนที่
            </h3>
            <p className="font-thai text-xs sm:text-sm text-primary/70">
              เดินทางสะดวก มีที่จอดรถใต้ถุนและลานจอดกว้างขวาง
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-accent/15">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-thai font-bold text-sm text-primary">ที่ตั้งเรือน ๑๐๐ ปี</h4>
              <p className="font-thai text-xs text-primary/80 leading-relaxed">
                {address}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-thai font-bold text-sm text-primary">เวลาเปิดครัว</h4>
              <p className="font-thai text-xs text-primary/80">
                {hours}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-thai font-bold text-sm text-primary">โทรสอบถาม / จองโต๊ะ</h4>
              <p className="font-thai text-xs text-primary/80">
                {phone}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center sm:text-left">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent/15 hover:bg-accent text-accent hover:text-[#1a100a] rounded-xl font-thai text-xs sm:text-sm font-bold border border-accent/30 transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>เปิด Google Maps นำทางมายังร้านลำลำลับแล →</span>
          </a>
        </div>
      </div>
    </div>
  );
}
