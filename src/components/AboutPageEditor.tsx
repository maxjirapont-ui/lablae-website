"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Home,
  UtensilsCrossed,
  Quote,
  CheckCircle2,
  AlertCircle,
  Users,
  Scroll,
} from "lucide-react";

export interface AboutCustomData {
  header_badge: string;
  header_title: string;
  header_subtitle: string;

  // Tab 1: House & 4 Generations
  tab1_title: string;
  tab1_desc: string;
  tab1_intro: string;
  tab1_gen1_badge: string;
  tab1_gen1_name: string;
  tab1_gen1_desc: string;
  tab1_gen2_badge: string;
  tab1_gen2_name: string;
  tab1_gen2_desc: string;
  tab1_gen3_badge: string;
  tab1_gen3_name: string;
  tab1_gen3_desc: string;
  tab1_gen4_badge: string;
  tab1_gen4_name: string;
  tab1_gen4_desc: string;
  tab1_quote_title: string;
  tab1_quote_text: string;

  // Tab 2: Flavors
  tab2_title: string;
  tab2_desc: string;
  tab2_intro: string;
  tab2_quote: string;
  tab2_card1_title: string;
  tab2_card1_desc: string;
  tab2_card2_title: string;
  tab2_card2_desc: string;
  tab2_card3_title: string;
  tab2_card3_desc: string;
  tab2_formula_title: string;
  tab2_formula_desc: string;

  // Tab 3: Legend
  tab3_title: string;
  tab3_desc: string;
  tab3_legend_title: string;
  tab3_legend_desc1: string;
  tab3_legend_desc2: string;
  tab3_card1_title: string;
  tab3_card1_desc: string;
  tab3_card2_title: string;
  tab3_card2_desc: string;
}

export const DEFAULT_ABOUT_DATA: AboutCustomData = {
  header_badge: "ลับแลง — ตำราเล่าเรื่อง",
  header_title: "ที่นี่คือจุดที่อดีตยังกินได้จริง",
  header_subtitle: "เรื่องราวของเรือนไม้ไร้ตะปู คนสี่รุ่น และสำรับอาหารแห่งความทรงจำ ณ ลำลำลับแล",

  tab1_title: "เรือนไม้ร้อยปีไร้ตะปู กับคน ๔ รุ่นที่รักษามันไว้",
  tab1_desc: "จากพ่อขากลิ้ง–แม่ขายอด หม่อนน้อย ตาเงิน–ยายจัน สู่วันที่บ้านกลับมาหายใจ",
  tab1_intro: "เรือนไม้หลังนี้สร้างขึ้นเมื่อราวร้อยปีก่อน โดยทวดของเราสองท่าน — พ่อขากลิ้งกับแม่ขายอด ในยุคที่พระศรีพนมมาศเพิ่งวางผังเมืองลับแลเสร็จไม่นาน การสร้างเรือนใหญ่หลังวัดป่ายางในยุคนั้น คือการประกาศว่าครอบครัวนี้จะหยั่งรากและไม่ไปไหนอีกแล้ว",
  tab1_gen1_badge: "รุ่นที่ ๑ · ผู้สร้าง",
  tab1_gen1_name: "พ่อขากลิ้ง กับ แม่ขายอด (สถาปัตยกรรมไร้ตะปู)",
  tab1_gen1_desc: "ท่านสร้างบ้านด้วยวิธีของช่างโบราณแท้ๆ: ไม่ใช้ตะปูแม้แต่ตัวเดียว ไม้ทั้งหลังสอดรับจับกันด้วยการเข้าเดือยเข้าสลัก ยืดหยุ่นตามการหดขยายของไม้ อยู่ทนได้เป็นร้อยปีอย่างที่ตะปูเหล็กทำไม่ได้ ทวดของเราสร้างบ้านด้วยตรรกะเดียวกับคนเมืองนี้: ช้ากว่า ยากกว่า แต่อยู่ทนกว่า",
  tab1_gen2_badge: "ผู้เฝ้าเรือน · ผู้ซื่อสัตย์",
  tab1_gen2_name: "หม่อนน้อย (ผู้ทำให้บ้านรอดพ้นการถูกรื้อขาย)",
  tab1_gen2_desc: "หญิงชราเท้าเปล่าผู้ใช้ชีวิตอยู่บนเรือนใหญ่เพียงลำพัง เลี้ยงชีพด้วยการทอผ้าซิ่นตีนจกบนกี่และเลี้ยงหมูใต้ถุน ในยุคที่เรือนโบราณทั่วลับแลเริ่มถูกรื้อขายเป็นไม้เก่า เรือนของเราหลังนี้รอดมาได้เพราะมีหม่อนน้อยอยู่เฝ้าทุกคืนนานหลายสิบปี ท่านคือผู้ร่วมสร้างประวัติศาสตร์ที่มีชีวิตของบ้านหลังนี้",
  tab1_gen3_badge: "รุ่นที่ ๓ · ผู้ให้รสมือ",
  tab1_gen3_name: "ตาเงิน กับ ยายจัน (กำเนิดสำรับปิ่นโตหน้ารถป๊อปน้อย)",
  tab1_gen3_desc: "ตาทำกับข้าว ยายจัดใส่ปิ่นโต ห้อยไว้กับรถป๊อปน้อยคู่ใจ ขี่ไปส่งลูกหลานทีละบ้าน กับข้าวเดินทางก่อนคำว่า “เดลิเวอรี” จะเกิดหลายสิบปี พริกแกงทุกครกโขลกเองด้วยมือ ไม่มีของสำเร็จเข้าบ้านนี้ และคือต้นกำเนิดของสำรับบ้านเรา: แกงอ่อม, สามชั้นทอดพริกข่า, น้ำพริกหนุ่ม, น้ำพริกอ่อง, และไส้อั่ว",
  tab1_gen4_badge: "รุ่นปัจจุบัน · ชุบชีวิต",
  tab1_gen4_name: "วันที่บ้านกลับมาหายใจ: เปิดร้านอาหารที่ใต้ถุน",
  tab1_gen4_desc: "เมื่อครอบครัวตัดสินใจไม่ขายเรือนทิ้ง แต่เปิดร้านอาหารที่ใต้ถุนบ้าน เพื่อให้บ้านได้อยู่ต่อทั้งหลัง ได้หายใจ ได้มีคนเดินขึ้นลงทุกวัน และต้อนรับทุกคนที่เดินทางมาถึงเมืองลับแล “เหมือนมากินข้าวบ้านญาติ”",
  tab1_quote_title: "“ที่นี่คือจุดที่อดีตยังกินได้จริง”",
  tab1_quote_text: "“ชานที่ท่านนั่ง คือชานที่เราคุยกับตาครั้งสุดท้าย ครัวที่หอมอยู่ คือครัวของยาย ใต้ถุนที่ท่านกินข้าว คือใต้ถุนของหม่อนน้อย และเสาทุกต้นที่ค้ำหลังคาอยู่ คือไม้ที่มือพ่อขากลิ้งเข้าเดือยไว้เมื่อร้อยปีก่อน”",

  tab2_title: "ทำไมรสชาติลับแลถึงไม่เหมือนที่ไหน?",
  tab2_desc: "“บ้านเราอยู่ตรงกลางพอดี รสชาติมันเลยผสมๆ” — คำตอบของยายจัน",
  tab2_intro: "หลายคนแปลกใจเมื่อได้ทานอาหารลับแล เพราะถึงแม้จะใช้คำเมือง ทานข้าวเหนียว แต่รสชาติกลับกลมกล่อม หวานละมุน และถูกปากคนภาคกลางอย่างน่าประหลาด คำตอบของเรื่องนี้ ยายจันเคยตอบไว้ในประโยคเดียวระหว่างโขลกพริกแกง:",
  tab2_quote: "“อาหารบ้านเรามันผสมหลายวัฒนธรรม บ้านเหนือแถบหัวดงเป็นล้านนา บ้านใต้แถบทุ่งยั้งเป็นสุโขทัย บ้านเราอยู่ตรงกลางพอดี รสชาติมันเลยผสมๆ”",
  tab2_card1_title: "๑. เผ็ดชาที่ผ่อนลงตามละติจูด",
  tab2_card1_desc: "ลับแลคือด่านสุดท้ายของอาณาจักร “มะแขว่น” กลิ่นรสเผ็ดชาแบบล้านนายังอยู่ครบ แต่เบามือลงจนลิ้นภาคกลางรับไหว ไม่แสบแก้วหู",
  tab2_card2_title: "๒. หวานธรรมชาติจากเมืองผลไม้",
  tab2_card2_desc: "เมืองที่ล้อมด้วยทุเรียน ลางสาด ลองกอง ความหวานจึงแทรกซึมเข้าสู่น้ำพริกและแกงอย่างละมุน ไม่ใช่ความหวานแปลกปลอมจากน้ำตาล",
  tab2_card3_title: "๓. ข้าวเจ้าเคียงข้าวเหนียว",
  tab2_card3_desc: "โลกเหนือกินข้าวเหนียว โลกสยามกินข้าวเจ้า ลับแลกินทั้งคู่ เกิดเป็นจานพิเศษที่มีที่นี่ที่เดียวอย่าง “ข้าวพันผัก”",
  tab2_formula_title: "สมการแห่งเมืองลับแล: ข้าวพันผัก",
  tab2_formula_desc: "เทคนิคข้าวแคบจากเหนือ + ข้าวเจ้าจากสายสุโขทัย + ผักสดจากสวนตัวเอง = ข้าวพันผัก จานที่เล่าประวัติศาสตร์ของทั้งเมืองได้ในคำเดียว",

  tab3_title: "ขอเพียงสัจจะวาจา: ตำนานและสิ่งที่จารึกบอก",
  tab3_desc: "บทเรียนของขมิ้นในย่าม ศิลาจารึกสุโขทัย และพระศรีพนมมาศ",
  tab3_legend_title: "“ขอเพียงสัจจะวาจา”",
  tab3_legend_desc1: "ตำนานเมืองแม่ม่ายที่ชายหนุ่มพลัดหลงเข้าไป และต้องออกจากเมืองเพียงเพราะคำโกหกเดียวเพื่อปลอบลูกที่กำลังร้องไห้ ภรรยาให้ย่ามใส่ขมิ้นติดตัวมา แต่เขาเห็นว่าหนักจึงทิ้งไปตลอดทาง กว่าจะรู้ว่าขมิ้นกลายเป็นทองคำ ก็เหลืออยู่ก้นย่ามไม่กี่แง่ง",
  tab3_legend_desc2: "สูตรของยาย ผักพื้นบ้านริมรั้ว วิธีตำพริกด้วยมือ เตาถ่านที่ช้ากว่าแก๊ส เรือนไม้ที่ซ่อมแพงกว่ารื้อ — ทั้งหมดคือ “ขมิ้นในย่าม” ที่เราสัญญาว่าจะรักษาไว้ ไม่ทิ้งไปตามกาลเวลา",
  tab3_card1_title: "ศิลาจารึกสุโขทัย (พุทธศตวรรษที่ ๑๙)",
  tab3_card1_desc: "หลักฐานขุดพบหน้าวิหารวัดเจดีย์คีรีวิหาร และซากคันดินโบราณเมืองทุ่งยั้ง บ่งชี้ว่าเมืองลับแลเป็นชุมชนที่อยู่ในสายพระเนตรและสายบุญของราชธานีสุโขทัยมาเนิ่นนาน",
  tab3_card2_title: "พระศรีพนมมาศ (นายอำเภอทองอิน)",
  tab3_card2_desc: "จากเด็กกำพร้าวัดป่ายาง สู่ผู้วางผังเมือง สร้างฝายหลวง และให้กำเนิด “ไม้กวาดตองกง” หัตถกรรมที่เลี้ยงคนทั้งเมืองมานับร้อยปี",
};

interface AboutPageEditorProps {
  currentJson: string;
  onSave: (jsonStr: string) => Promise<void>;
  isLoading: boolean;
}

export default function AboutPageEditor({
  currentJson,
  onSave,
  isLoading,
}: AboutPageEditorProps) {
  const [data, setData] = useState<AboutCustomData>(() => {
    try {
      if (currentJson) {
        const parsed = JSON.parse(currentJson);
        return { ...DEFAULT_ABOUT_DATA, ...parsed };
      }
    } catch {}
    return DEFAULT_ABOUT_DATA;
  });

  const [activeTab, setActiveTab] = useState<"header" | "tab1" | "tab2" | "tab3">("tab1");
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    try {
      if (currentJson) {
        const parsed = JSON.parse(currentJson);
        setData({ ...DEFAULT_ABOUT_DATA, ...parsed });
      }
    } catch {}
    setIsDirty(false);
    setErrorMessage("");
  }, [currentJson]);

  const handleChange = (field: keyof AboutCustomData, val: string) => {
    setData((prev) => ({ ...prev, [field]: val }));
    setIsDirty(true);
    setSaveSuccess(false);
    setErrorMessage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      await onSave(JSON.stringify(data));
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("ต้องการคืนค่าข้อความหน้าเกี่ยวกับเราทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่?")) {
      setData(DEFAULT_ABOUT_DATA);
      setIsDirty(true);
    }
  };

  return (
    <div id="admin-about-page-editor" className="p-6 sm:p-8 bg-white rounded-3xl border border-primary/10 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-[11px] font-bold">
              หน้ารู้จักเรา & เรื่องเล่า
            </span>
            <span className="text-xs font-bold text-primary">/about</span>
          </div>
          <h3 className="text-lg font-bold text-primary">
            จัดการเนื้อหาหน้า “รู้จักเรา & ตำนานลับแล” (About Page)
          </h3>
          <p className="text-xs text-primary/70 leading-relaxed">
            สามารถแก้ไขชื่อบรรพบุรุษ ประวัติศาสตร์ ๔ รุ่นคน รสชาติรอยต่อวัฒนธรรม และตำนานเมืองลับแล ให้ถูกต้องตรงตามจริงได้ทุกส่วน
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>

      {/* Tabs Switcher for Editor */}
      <div className="flex flex-wrap gap-2 border-b border-primary/10 pb-3">
        {[
          { id: "header" as const, label: "หัวข้อหน้าเว็บ", icon: Sparkles },
          { id: "tab1" as const, label: "แท็บ ๑: คน ๔ รุ่น & เรือนไม้", icon: Home },
          { id: "tab2" as const, label: "แท็บ ๒: รสชาติรอยต่อ", icon: UtensilsCrossed },
          { id: "tab3" as const, label: "แท็บ ๓: ตำนานสัจจะวาจา", icon: Scroll },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isSelected
                  ? "bg-accent text-white shadow-xs"
                  : "bg-cream text-primary/70 hover:bg-accent/10 hover:text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 0: PAGE HEADER */}
        {activeTab === "header" && (
          <div className="space-y-4">
            <div className="p-4 bg-cream/40 rounded-2xl border border-primary/10 space-y-3">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  ป้ายกำกับบนสุด (Badge)
                </label>
                <input
                  type="text"
                  value={data.header_badge}
                  onChange={(e) => handleChange("header_badge", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  หัวข้อหลักหน้าเว็บ (Page Title)
                </label>
                <input
                  type="text"
                  value={data.header_title}
                  onChange={(e) => handleChange("header_title", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm font-bold text-primary focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  คำโปรยใต้หัวข้อ (Subtitle)
                </label>
                <textarea
                  rows={2}
                  value={data.header_subtitle}
                  onChange={(e) => handleChange("header_subtitle", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: 4 GENERATIONS & HOUSE */}
        {activeTab === "tab1" && (
          <div className="space-y-6">
            <div className="p-4 bg-cream/40 rounded-2xl border border-primary/10 space-y-3">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Home className="w-4 h-4 text-accent" />
                <span>หัวข้อและบทนำของแท็บ ๑</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1">
                    ชื่อหัวข้อแท็บ ๑
                  </label>
                  <input
                    type="text"
                    value={data.tab1_title}
                    onChange={(e) => handleChange("tab1_title", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1">
                    คำโปรยใต้หัวข้อแท็บ ๑
                  </label>
                  <input
                    type="text"
                    value={data.tab1_desc}
                    onChange={(e) => handleChange("tab1_desc", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  บทนำเรื่องราวเรือนไม้
                </label>
                <textarea
                  rows={3}
                  value={data.tab1_intro}
                  onChange={(e) => handleChange("tab1_intro", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* 4 Generation Cards */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Users className="w-4 h-4 text-accent" />
                <span>ไทม์ไลน์บุคคล ๔ ยุคสมัย (ปรับเปลี่ยนชื่อและเรื่องเล่าได้ที่นี่)</span>
              </h4>

              {/* Gen 1 */}
              <div className="p-4 bg-white rounded-2xl border border-primary/15 shadow-xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-accent-dark mb-1">
                      ป้ายกำกับรุ่นที่ ๑
                    </label>
                    <input
                      type="text"
                      value={data.tab1_gen1_badge}
                      onChange={(e) => handleChange("tab1_gen1_badge", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-cream/20 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-primary mb-1">
                      ชื่อบรรพบุรุษ / หัวข้อรุ่นที่ ๑
                    </label>
                    <input
                      type="text"
                      value={data.tab1_gen1_name}
                      onChange={(e) => handleChange("tab1_gen1_name", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-white text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-primary/70 mb-1">
                    เนื้อหาเรื่องราวรุ่นที่ ๑
                  </label>
                  <textarea
                    rows={3}
                    value={data.tab1_gen1_desc}
                    onChange={(e) => handleChange("tab1_gen1_desc", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-white text-xs"
                  />
                </div>
              </div>

              {/* Gen 2 */}
              <div className="p-4 bg-white rounded-2xl border border-primary/15 shadow-xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-accent-dark mb-1">
                      ป้ายกำกับผู้เฝ้าเรือน
                    </label>
                    <input
                      type="text"
                      value={data.tab1_gen2_badge}
                      onChange={(e) => handleChange("tab1_gen2_badge", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-cream/20 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-primary mb-1">
                      ชื่อบรรพบุรุษ / หัวข้อ
                    </label>
                    <input
                      type="text"
                      value={data.tab1_gen2_name}
                      onChange={(e) => handleChange("tab1_gen2_name", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-white text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-primary/70 mb-1">
                    เนื้อหาเรื่องราว
                  </label>
                  <textarea
                    rows={3}
                    value={data.tab1_gen2_desc}
                    onChange={(e) => handleChange("tab1_gen2_desc", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-white text-xs"
                  />
                </div>
              </div>

              {/* Gen 3 */}
              <div className="p-4 bg-white rounded-2xl border border-primary/15 shadow-xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-accent-dark mb-1">
                      ป้ายกำกับรุ่นที่ ๓
                    </label>
                    <input
                      type="text"
                      value={data.tab1_gen3_badge}
                      onChange={(e) => handleChange("tab1_gen3_badge", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-cream/20 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-primary mb-1">
                      ชื่อบรรพบุรุษ / หัวข้อรุ่นที่ ๓
                    </label>
                    <input
                      type="text"
                      value={data.tab1_gen3_name}
                      onChange={(e) => handleChange("tab1_gen3_name", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-white text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-primary/70 mb-1">
                    เนื้อหาเรื่องราวรุ่นที่ ๓ (ต้นกำเนิดรสมือ / เมนูเด็ด)
                  </label>
                  <textarea
                    rows={3}
                    value={data.tab1_gen3_desc}
                    onChange={(e) => handleChange("tab1_gen3_desc", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-white text-xs"
                  />
                </div>
              </div>

              {/* Gen 4 */}
              <div className="p-4 bg-white rounded-2xl border border-primary/15 shadow-xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-accent-dark mb-1">
                      ป้ายกำกับรุ่นปัจจุบัน
                    </label>
                    <input
                      type="text"
                      value={data.tab1_gen4_badge}
                      onChange={(e) => handleChange("tab1_gen4_badge", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-cream/20 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-primary mb-1">
                      ชื่อหัวข้อรุ่นปัจจุบัน
                    </label>
                    <input
                      type="text"
                      value={data.tab1_gen4_name}
                      onChange={(e) => handleChange("tab1_gen4_name", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-white text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-primary/70 mb-1">
                    เนื้อหาเรื่องราวรุ่นปัจจุบัน (เปิดร้านอาหารใต้ถุนเรือน)
                  </label>
                  <textarea
                    rows={3}
                    value={data.tab1_gen4_desc}
                    onChange={(e) => handleChange("tab1_gen4_desc", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-primary/20 bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Quote */}
            <div className="p-4 bg-cream/40 rounded-2xl border border-primary/10 space-y-2">
              <label className="block text-xs font-bold text-primary">
                คำคมปิดท้ายแท็บ ๑ (Callout Quote)
              </label>
              <input
                type="text"
                value={data.tab1_quote_title}
                onChange={(e) => handleChange("tab1_quote_title", e.target.value)}
                placeholder="เช่น “ที่นี่คือจุดที่อดีตยังกินได้จริง”"
                className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs font-bold"
              />
              <textarea
                rows={2}
                value={data.tab1_quote_text}
                onChange={(e) => handleChange("tab1_quote_text", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs"
              />
            </div>
          </div>
        )}

        {/* TAB 2: FLAVORS */}
        {activeTab === "tab2" && (
          <div className="space-y-4">
            <div className="p-4 bg-cream/40 rounded-2xl border border-primary/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">หัวข้อแท็บ ๒</label>
                  <input
                    type="text"
                    value={data.tab2_title}
                    onChange={(e) => handleChange("tab2_title", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">คำโปรยแท็บ ๒</label>
                  <input
                    type="text"
                    value={data.tab2_desc}
                    onChange={(e) => handleChange("tab2_desc", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">บทนำ</label>
                <textarea
                  rows={2}
                  value={data.tab2_intro}
                  onChange={(e) => handleChange("tab2_intro", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">คำคมยายจัน (Quote)</label>
                <textarea
                  rows={2}
                  value={data.tab2_quote}
                  onChange={(e) => handleChange("tab2_quote", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs"
                />
              </div>
            </div>

            {/* 3 Flavor Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-2xl border border-primary/15 space-y-2">
                <label className="block text-[11px] font-bold text-primary">การ์ดที่ ๑</label>
                <input
                  type="text"
                  value={data.tab2_card1_title}
                  onChange={(e) => handleChange("tab2_card1_title", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={data.tab2_card1_desc}
                  onChange={(e) => handleChange("tab2_card1_desc", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs"
                />
              </div>
              <div className="p-3 bg-white rounded-2xl border border-primary/15 space-y-2">
                <label className="block text-[11px] font-bold text-primary">การ์ดที่ ๒</label>
                <input
                  type="text"
                  value={data.tab2_card2_title}
                  onChange={(e) => handleChange("tab2_card2_title", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={data.tab2_card2_desc}
                  onChange={(e) => handleChange("tab2_card2_desc", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs"
                />
              </div>
              <div className="p-3 bg-white rounded-2xl border border-primary/15 space-y-2">
                <label className="block text-[11px] font-bold text-primary">การ์ดที่ ๓</label>
                <input
                  type="text"
                  value={data.tab2_card3_title}
                  onChange={(e) => handleChange("tab2_card3_title", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={data.tab2_card3_desc}
                  onChange={(e) => handleChange("tab2_card3_desc", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs"
                />
              </div>
            </div>

            {/* Formula */}
            <div className="p-3 bg-cream/30 rounded-2xl border border-primary/15 space-y-2">
              <label className="block text-xs font-bold text-primary">สมการแห่งเมืองลับแล (กล่องล่างสุด)</label>
              <input
                type="text"
                value={data.tab2_formula_title}
                onChange={(e) => handleChange("tab2_formula_title", e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-bold"
              />
              <textarea
                rows={2}
                value={data.tab2_formula_desc}
                onChange={(e) => handleChange("tab2_formula_desc", e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-primary/20 text-xs"
              />
            </div>
          </div>
        )}

        {/* TAB 3: LEGEND */}
        {activeTab === "tab3" && (
          <div className="space-y-4">
            <div className="p-4 bg-cream/40 rounded-2xl border border-primary/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">หัวข้อแท็บ ๓</label>
                  <input
                    type="text"
                    value={data.tab3_title}
                    onChange={(e) => handleChange("tab3_title", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">คำโปรยแท็บ ๓</label>
                  <input
                    type="text"
                    value={data.tab3_desc}
                    onChange={(e) => handleChange("tab3_desc", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">หัวข้อกล่องตำนาน</label>
                <input
                  type="text"
                  value={data.tab3_legend_title}
                  onChange={(e) => handleChange("tab3_legend_title", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-primary mb-1">เนื้อเรื่องตำนานขมิ้นในย่าม</label>
                <textarea
                  rows={3}
                  value={data.tab3_legend_desc1}
                  onChange={(e) => handleChange("tab3_legend_desc1", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-primary/20 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-primary mb-1">ข้อคิดและคำสัญญาของร้าน</label>
                <textarea
                  rows={2}
                  value={data.tab3_legend_desc2}
                  onChange={(e) => handleChange("tab3_legend_desc2", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-primary/20 text-xs italic"
                />
              </div>
            </div>

            {/* 2 History cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-2xl border border-primary/15 space-y-2">
                <label className="block text-[11px] font-bold text-primary">การ์ดที่ ๑ (ศิลาจารึกสุโขทัย)</label>
                <input
                  type="text"
                  value={data.tab3_card1_title}
                  onChange={(e) => handleChange("tab3_card1_title", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={data.tab3_card1_desc}
                  onChange={(e) => handleChange("tab3_card1_desc", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs"
                />
              </div>
              <div className="p-3 bg-white rounded-2xl border border-primary/15 space-y-2">
                <label className="block text-[11px] font-bold text-primary">การ์ดที่ ๒ (พระศรีพนมมาศ)</label>
                <input
                  type="text"
                  value={data.tab3_card2_title}
                  onChange={(e) => handleChange("tab3_card2_title", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={data.tab3_card2_desc}
                  onChange={(e) => handleChange("tab3_card2_desc", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-primary/20 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกเนื้อหาหน้าเกี่ยวกับเราสำเร็จแล้ว!</span>
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-primary/20 hover:bg-cream text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าข้อความเริ่มต้น</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs sm:text-sm font-bold shadow-xs hover:scale-[1.02] transition-all cursor-pointer ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "กำลังบันทึก..." : "💾 บันทึกเนื้อหาหน้าเกี่ยวกับเรา"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Live Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1a100a] text-[#f5ece1] rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-accent/20 font-thai space-y-6">
            <div className="flex items-center justify-between border-b border-accent/20 pb-3">
              <span className="text-xs font-bold text-accent">
                ตัวอย่างการแสดงผลหน้ารู้จักเรา (/about)
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-xs text-white/60 hover:text-white cursor-pointer px-2 py-1 rounded-lg bg-white/10"
              >
                ปิดตัวอย่าง
              </button>
            </div>

            <div className="space-y-3 text-center">
              <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold">
                {data.header_badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                {data.header_title}
              </h2>
              <p className="text-xs sm:text-sm text-[#f5ece1]/70 max-w-lg mx-auto">
                {data.header_subtitle}
              </p>
            </div>

            {/* Simulated Tab Box */}
            <div className="p-6 bg-[#241710] rounded-2xl border border-accent/20 space-y-4">
              <h3 className="font-bold text-lg text-primary">{data.tab1_title}</h3>
              <p className="text-xs text-accent-dark">{data.tab1_desc}</p>
              <p className="text-xs leading-relaxed text-[#f5ece1]/80">{data.tab1_intro}</p>

              {/* Gen 1 preview */}
              <div className="p-3 bg-[#1a100a] rounded-xl border border-accent/15 space-y-1">
                <span className="text-[10px] text-accent font-bold">{data.tab1_gen1_badge}</span>
                <p className="text-xs font-bold text-primary">{data.tab1_gen1_name}</p>
                <p className="text-[11px] text-[#f5ece1]/70">{data.tab1_gen1_desc}</p>
              </div>

              {/* Gen 3 preview */}
              <div className="p-3 bg-[#1a100a] rounded-xl border border-accent/15 space-y-1">
                <span className="text-[10px] text-accent font-bold">{data.tab1_gen3_badge}</span>
                <p className="text-xs font-bold text-primary">{data.tab1_gen3_name}</p>
                <p className="text-[11px] text-[#f5ece1]/70">{data.tab1_gen3_desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
