"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Home, UtensilsCrossed, BookOpen, Heart, ArrowRight, MapPin, Clock, Phone, Navigation } from "lucide-react";

export default function About() {
  const [activeTab, setActiveTab] = useState<"house" | "food" | "legend">("house");

  const tabs = [
    {
      id: "house" as const,
      label: "คน ๔ รุ่นกับเรือนไม้ไร้ตะปู",
      icon: Home,
      title: "เรือนไม้ร้อยปีไร้ตะปู กับคน ๔ รุ่นที่รักษามันไว้",
      desc: "จากพ่อขากลิ้ง–แม่ขายอด หม่อนน้อย ตาเงิน–ยายจัน สู่วันที่บ้านกลับมาหายใจ",
      content: (
        <div className="space-y-8 font-thai text-sm sm:text-base leading-relaxed text-primary-dark/85">
          <p className="text-base sm:text-lg text-primary font-medium leading-relaxed">
            เรือนไม้หลังนี้สร้างขึ้นเมื่อราวร้อยปีก่อน โดยทวดของเราสองท่าน — <strong>พ่อขากลิ้งกับแม่ขายอด</strong> ในยุคที่พระศรีพนมมาศเพิ่งวางผังเมืองลับแลเสร็จไม่นาน การสร้างเรือนใหญ่หลังวัดป่ายางในยุคนั้น คือการประกาศว่าครอบครัวนี้จะหยั่งรากและไม่ไปไหนอีกแล้ว
          </p>

          {/* Timeline of 4 Generations */}
          <div className="space-y-6 relative border-l-2 border-accent/40 pl-6 ml-2 sm:ml-4">
            {/* Gen 1 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-cream" />
              <span className="text-xs font-bold text-accent-dark tracking-wider uppercase">รุ่นที่ ๑ · ผู้สร้าง</span>
              <h4 className="font-bold text-lg text-primary">พ่อขากลิ้ง กับ แม่ขายอด (สถาปัตยกรรมไร้ตะปู)</h4>
              <p className="text-xs sm:text-sm text-primary-dark/80">
                ท่านสร้างบ้านด้วยวิธีของช่างโบราณแท้ๆ: <strong>ไม่ใช้ตะปูแม้แต่ตัวเดียว</strong> ไม้ทั้งหลังสอดรับจับกันด้วยการเข้าเดือยเข้าสลัก ยืดหยุ่นตามการหดขยายของไม้ อยู่ทนได้เป็นร้อยปีอย่างที่ตะปูเหล็กทำไม่ได้ ทวดของเราสร้างบ้านด้วยตรรกะเดียวกับคนเมืองนี้: <em>ช้ากว่า ยากกว่า แต่อยู่ทนกว่า</em>
              </p>
            </div>

            {/* Guardian */}
            <div className="relative space-y-2">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-cream" />
              <span className="text-xs font-bold text-accent-dark tracking-wider uppercase">ผู้เฝ้าเรือน · ผู้ซื่อสัตย์</span>
              <h4 className="font-bold text-lg text-primary">หม่อนน้อย (ผู้ทำให้บ้านรอดพ้นการถูกรื้อขาย)</h4>
              <p className="text-xs sm:text-sm text-primary-dark/80">
                หญิงชราเท้าเปล่าผู้ใช้ชีวิตอยู่บนเรือนใหญ่เพียงลำพัง เลี้ยงชีพด้วยการทอผ้าซิ่นตีนจกบนกี่และเลี้ยงหมูใต้ถุน ในยุคที่เรือนโบราณทั่วลับแลเริ่มถูกรื้อขายเป็นไม้เก่า เรือนของเราหลังนี้รอดมาได้เพราะมีหม่อนน้อยอยู่เฝ้าทุกคืนนานหลายสิบปี ท่านคือผู้ร่วมสร้างประวัติศาสตร์ที่มีชีวิตของบ้านหลังนี้
              </p>
            </div>

            {/* Gen 3 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-cream" />
              <span className="text-xs font-bold text-accent-dark tracking-wider uppercase">รุ่นที่ ๓ · ผู้ให้รสมือ</span>
              <h4 className="font-bold text-lg text-primary">ตาเงิน กับ ยายจัน (กำเนิดสำรับปิ่นโตหน้ารถป๊อปน้อย)</h4>
              <p className="text-xs sm:text-sm text-primary-dark/80">
                ตาทำกับข้าว ยายจัดใส่ปิ่นโต ห้อยไว้กับรถป๊อปน้อยคู่ใจ ขี่ไปส่งลูกหลานทีละบ้าน กับข้าวเดินทางก่อนคำว่า “เดลิเวอรี” จะเกิดหลายสิบปี พริกแกงทุกครกโขลกเองด้วยมือ ไม่มีของสำเร็จเข้าบ้านนี้ และคือต้นกำเนิดของสำรับบ้านเรา: <strong>แกงอ่อม, สามชั้นทอดพริกข่า, น้ำพริกหนุ่ม, น้ำพริกอ่อง, และไส้อั่ว</strong>
              </p>
            </div>

            {/* Gen 4 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-cream" />
              <span className="text-xs font-bold text-primary tracking-wider uppercase">รุ่นปัจจุบัน · ชุบชีวิต</span>
              <h4 className="font-bold text-lg text-primary">วันที่บ้านกลับมาหายใจ: เปิดร้านอาหารที่ใต้ถุน</h4>
              <p className="text-xs sm:text-sm text-primary-dark/80">
                เมื่อครอบครัวตัดสินใจไม่ขายเรือนทิ้ง แต่เปิดร้านอาหารที่ใต้ถุนบ้าน เพื่อให้บ้านได้อยู่ต่อทั้งหลัง ได้หายใจ ได้มีคนเดินขึ้นลงทุกวัน และต้อนรับทุกคนที่เดินทางมาถึงเมืองลับแล <strong>“เหมือนมากินข้าวบ้านญาติ”</strong>
              </p>
            </div>
          </div>

          <div className="p-6 bg-accent/10 rounded-2xl border border-accent/20 space-y-2">
            <h5 className="font-bold text-primary flex items-center gap-2 text-base">
              <Heart className="w-4 h-4 text-accent fill-current" />
              “ที่นี่คือจุดที่อดีตยังกินได้จริง”
            </h5>
            <p className="text-xs sm:text-sm text-primary-dark/85 italic leading-relaxed">
              “ชานที่ท่านนั่ง คือชานที่เราคุยกับตาครั้งสุดท้าย ครัวที่หอมอยู่ คือครัวของยาย ใต้ถุนที่ท่านกินข้าว คือใต้ถุนของหม่อนน้อย และเสาทุกต้นที่ค้ำหลังคาอยู่ คือไม้ที่มือพ่อขากลิ้งเข้าเดือยไว้เมื่อร้อยปีก่อน”
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "food" as const,
      label: "รสชาติรอยต่อวัฒนธรรม",
      icon: UtensilsCrossed,
      title: "ทำไมรสชาติลับแลถึงไม่เหมือนที่ไหน?",
      desc: "“บ้านเราอยู่ตรงกลางพอดี รสชาติมันเลยผสมๆ” — คำตอบของยายจัน",
      content: (
        <div className="space-y-6 font-thai text-sm sm:text-base leading-relaxed text-primary-dark/85">
          <p>
            หลายคนแปลกใจเมื่อได้ทานอาหารลับแล เพราะถึงแม้จะใช้คำเมือง ทานข้าวเหนียว แต่รสชาติกลับกลมกล่อม หวานละมุน และถูกปากคนภาคกลางอย่างน่าประหลาด คำตอบของเรื่องนี้ ยายจันเคยตอบไว้ในประโยคเดียวระหว่างโขลกพริกแกง:
          </p>

          <blockquote className="p-5 bg-cream border-l-4 border-accent rounded-r-2xl text-base sm:text-lg font-bold text-primary italic">
            “อาหารบ้านเรามันผสมหลายวัฒนธรรม บ้านเหนือแถบหัวดงเป็นล้านนา บ้านใต้แถบทุ่งยั้งเป็นสุโขทัย บ้านเราอยู่ตรงกลางพอดี รสชาติมันเลยผสมๆ”
          </blockquote>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-5 bg-cream border border-primary/5 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">๑. เผ็ดชาที่ผ่อนลงตามละติจูด</h4>
              <p className="text-xs text-primary-dark/75 leading-relaxed">
                ลับแลคือด่านสุดท้ายของอาณาจักร “มะแขว่น” กลิ่นรสเผ็ดชาแบบล้านนายังอยู่ครบ แต่เบามือลงจนลิ้นภาคกลางรับไหว ไม่แสบแก้วหู
              </p>
            </div>

            <div className="p-5 bg-cream border border-primary/5 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">๒. หวานธรรมชาติจากเมืองผลไม้</h4>
              <p className="text-xs text-primary-dark/75 leading-relaxed">
                เมืองที่ล้อมด้วยทุเรียน ลางสาด ลองกอง ความหวานจึงแทรกซึมเข้าสู่น้ำพริกและแกงอย่างละมุน ไม่ใช่ความหวานแปลกปลอมจากน้ำตาล
              </p>
            </div>

            <div className="p-5 bg-cream border border-primary/5 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">๓. ข้าวเจ้าเคียงข้าวเหนียว</h4>
              <p className="text-xs text-primary-dark/75 leading-relaxed">
                โลกเหนือกินข้าวเหนียว โลกสยามกินข้าวเจ้า ลับแลกินทั้งคู่ เกิดเป็นจานพิเศษที่มีที่นี่ที่เดียวอย่าง “ข้าวพันผัก”
              </p>
            </div>
          </div>

          <div className="p-5 bg-primary-dark/5 rounded-2xl border border-primary/10">
            <h4 className="font-bold text-primary text-sm mb-1">สมการแห่งเมืองลับแล: ข้าวพันผัก</h4>
            <p className="text-xs sm:text-sm text-primary-dark/80">
              <strong>เทคนิคข้าวแคบจากเหนือ + ข้าวเจ้าจากสายสุโขทัย + ผักสดจากสวนตัวเอง = ข้าวพันผัก</strong> จานที่เล่าประวัติศาสตร์ของทั้งเมืองได้ในคำเดียว
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "legend" as const,
      label: "ตำนานและสัจจะวาจา",
      icon: Sparkles,
      title: "ขอเพียงสัจจะวาจา: ตำนานและสิ่งที่จารึกบอก",
      desc: "บทเรียนของขมิ้นในย่าม ศิลาจารึกสุโขทัย และพระศรีพนมมาศ",
      content: (
        <div className="space-y-6 font-thai text-sm sm:text-base leading-relaxed text-primary-dark/85">
          <div className="p-5 bg-cream border-l-4 border-primary rounded-r-2xl space-y-2">
            <h4 className="font-bold text-primary text-base">“ขอเพียงสัจจะวาจา”</h4>
            <p className="text-xs sm:text-sm text-primary-dark/80">
              ตำนานเมืองแม่ม่ายที่ชายหนุ่มพลัดหลงเข้าไป และต้องออกจากเมืองเพียงเพราะคำโกหกเดียวเพื่อปลอบลูกที่กำลังร้องไห้ ภรรยาให้ย่ามใส่ขมิ้นติดตัวมา แต่เขาเห็นว่าหนักจึงทิ้งไปตลอดทาง กว่าจะรู้ว่าขมิ้นกลายเป็นทองคำ ก็เหลืออยู่ก้นย่ามไม่กี่แง่ง
            </p>
            <p className="text-xs sm:text-sm text-primary-dark/80 italic pt-1">
              สูตรของยาย ผักพื้นบ้านริมรั้ว วิธีตำพริกด้วยมือ เตาถ่านที่ช้ากว่าแก๊ส เรือนไม้ที่ซ่อมแพงกว่ารื้อ — ทั้งหมดคือ <strong>“ขมิ้นในย่าม”</strong> ที่เราสัญญาว่าจะรักษาไว้ ไม่ทิ้งไปตามกาลเวลา
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-cream border border-primary/5 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">ศิลาจารึกสุโขทัย (พุทธศตวรรษที่ ๑๙)</h4>
              <p className="text-xs text-primary-dark/75 leading-relaxed">
                หลักฐานขุดพบหน้าวิหารวัดเจดีย์คีรีวิหาร และซากคันดินโบราณเมืองทุ่งยั้ง บ่งชี้ว่าเมืองลับแลเป็นชุมชนที่อยู่ในสายพระเนตรและสายบุญของราชธานีสุโขทัยมาเนิ่นนาน
              </p>
            </div>

            <div className="p-5 bg-cream border border-primary/5 rounded-2xl space-y-2">
              <h4 className="font-bold text-primary text-sm">พระศรีพนมมาศ (นายอำเภอทองอิน)</h4>
              <p className="text-xs text-primary-dark/75 leading-relaxed">
                จากเด็กกำพร้าวัดป่ายาง สู่ผู้วางผังเมือง สร้างฝายหลวง และให้กำเนิด “ไม้กวาดตองกง” หัตถกรรมที่เลี้ยงคนทั้งเมืองมานับร้อยปี
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
          ลับแลง — ตำราเล่าเรื่อง
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-thai text-primary">
          ที่นี่คือจุดที่อดีตยังกินได้จริง
        </h1>
        <p className="font-thai text-sm sm:text-base text-primary/70 max-w-xl mx-auto">
          เรื่องราวของเรือนไม้ไร้ตะปู คนสี่รุ่น และสำรับอาหารแห่งความทรงจำ ณ ลำลำลับแล
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
      <div className="wood-card bg-cream rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="space-y-2 border-b border-primary/5 pb-4">
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
      <div className="p-8 bg-gradient-to-r from-cream via-accent/15 to-cream rounded-3xl border border-primary/10 text-center space-y-4">
        <div className="inline-flex p-3 bg-white rounded-2xl shadow-xs text-accent">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="font-thai font-bold text-xl sm:text-2xl text-primary">
          อ่านฉบับเต็มใน “ตำราลับแลง” ทั้ง ๒๙ บท
        </h3>
        <p className="font-thai text-xs sm:text-sm text-primary/70 max-w-md mx-auto">
          อ่านเรื่องราวประวัติศาสตร์ บันทึกครัวตาเงิน-ยายจัน และวิธีปรุงอาหารสูตรดั้งเดิมบนหน้าเว็บได้ฟรี
        </p>
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-full font-thai text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105"
          >
            <span>เปิดอ่านสารบัญตำราลับแลง</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Map & Directions Section (Old URL Target: /รจกเรา/เสนทางมาราน) */}
      <div id="directions" className="scroll-mt-24 p-8 sm:p-10 bg-cream rounded-3xl border border-primary/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/20 text-accent-dark rounded-2xl">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-thai font-bold text-xl sm:text-2xl text-primary">
              เส้นทางมาร้าน & แผนที่การเดินทาง
            </h3>
            <p className="font-thai text-xs sm:text-sm text-primary/70">
              ร้านลำลำลับแลบ้าน ๑๐๐ ปี ใต้ถุนเรือนไม้ไร้ตะปู อ.ลับแล จ.อุตรดิตถ์
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 font-thai">
          <div className="p-5 bg-white rounded-2xl border border-primary/5 space-y-2">
            <div className="flex items-center gap-2 text-accent-dark font-bold text-sm">
              <MapPin className="w-4 h-4" />
              <span>ที่ตั้งร้าน</span>
            </div>
            <p className="text-xs sm:text-sm text-primary/80 leading-relaxed">
              ถนนสายของกินเมืองลับแล, ต.ศรีพนมมาศ, อ.ลับแล, จ.อุตรดิตถ์ (อยู่ใกล้ซุ้มประตูเมืองลับแลและอนุสาวรีย์พระศรีพนมมาศ มีที่จอดรถสะดวกสบาย)
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-primary/5 space-y-2">
            <div className="flex items-center gap-2 text-accent-dark font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>เวลาเปิด-ปิด</span>
            </div>
            <p className="text-xs sm:text-sm text-primary/80 leading-relaxed">
              เปิดบริการทุกวัน <strong>10.00 - 20.00 น.</strong>
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-primary/5 space-y-2">
            <div className="flex items-center gap-2 text-accent-dark font-bold text-sm">
              <Phone className="w-4 h-4" />
              <span>โทรจองโต๊ะ / สั่งอาหาร</span>
            </div>
            <p className="text-xs sm:text-sm text-primary/80 leading-relaxed">
              โทร: <a href="tel:0956283125" className="font-bold text-accent-dark underline">095-628-3125</a>
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://maps.app.goo.gl/PcogZoYFxaPPAV2J8?g_st=ic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-accent hover:bg-accent-dark text-white rounded-full font-thai text-sm font-bold shadow-md transition-all hover:scale-105"
          >
            <MapPin className="w-4 h-4" />
            <span>เปิดนำทางด้วย Google Maps</span>
          </a>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/15 rounded-full font-thai text-sm font-semibold transition-all hover:scale-105"
          >
            <UtensilsCrossed className="w-4 h-4 text-accent-dark" />
            <span>ดูเมนูอาหารทั้งหมด</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
