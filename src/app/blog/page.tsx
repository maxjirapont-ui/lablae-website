import React from "react";
import Link from "next/link";
import { getArticles, Article } from "@/lib/data";
import { Sparkles, BookOpen, ChevronRight, Bookmark, ArrowUpRight } from "lucide-react";

export const revalidate = 0; // Disable static cache

export default async function BlogListingPage() {
  const articles = await getArticles();

  // Group chapters by part_title
  const grouped: { [key: string]: Article[] } = {};
  articles.forEach((art) => {
    const key = art.part_title || "บททั่วไป";
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(art);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Book Title Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#2c1a10] via-[#20120a] to-[#2c1a10] text-[#f7eee3] p-8 sm:p-12 shadow-xl border border-accent/25 overflow-hidden text-center space-y-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,160,89,0.15),transparent_70%)] pointer-events-none" />
        
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-thai font-medium border border-accent/30 tracking-wide">
          <BookOpen className="w-3.5 h-3.5" />
          บันทึกเรื่องเล่าเมืองลับแล
        </span>

        <h1 className="text-3xl sm:text-5xl font-bold font-thai text-[#f7eee3] tracking-wide">
          ตำราลับแลง
        </h1>

        <p className="text-base sm:text-lg font-thai text-accent font-medium max-w-xl mx-auto">
          เรื่องเล่าของคน 4 รุ่น บันทึกครัวโบราณ และวิถีชีวิตเมืองลับแล
        </p>

        <p className="text-xs sm:text-sm font-thai text-[#f7eee3]/75 max-w-md mx-auto leading-relaxed">
          จากแผ่นดินล้านนา–สุโขทัย สู่สำรับอาหารของตาเงิน–ยายจัน<br />
          ร้านลำลำลับแลบ้าน 100 ปี อ.ลับแล จ.อุตรดิตถ์
        </p>

        <div className="pt-2 flex justify-center items-center gap-2 text-xs font-thai text-[#f7eee3]/60">
          <span>รวมทั้งสิ้น {articles.length} บท</span>
          <span>•</span>
          <span>สแกนอ่านได้จากโต๊ะอาหาร</span>
        </div>
      </div>

      {/* Chapters Grouped by Parts */}
      <div className="space-y-10">
        {Object.entries(grouped).map(([partTitle, chapterList]) => (
          <div key={partTitle} className="space-y-4">
            {/* Part Header */}
            <div className="flex items-center gap-3 border-b border-primary/10 pb-3">
              <Bookmark className="w-4 h-4 text-accent" />
              <h2 className="text-lg sm:text-xl font-bold font-thai text-primary">
                {partTitle}
              </h2>
              <span className="text-xs font-thai text-primary/40 ml-auto">
                {chapterList.length} ตอน
              </span>
            </div>

            {/* Chapters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chapterList.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/blog/${chapter.slug}`}
                  className="group wood-card bg-[#241710] hover:bg-[#2d1d14] p-5 rounded-2xl border border-accent/20 hover:border-accent/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-thai font-bold text-sm sm:text-base text-primary group-hover:text-accent transition-colors leading-snug">
                        {chapter.title}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-accent/60 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                    </div>

                    <p className="font-thai text-xs text-primary/70 line-clamp-2 leading-relaxed">
                      {chapter.excerpt || chapter.content.substring(0, 120)}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-accent/15 flex items-center justify-between text-[11px] font-thai text-primary/50">
                    <span className="group-hover:text-accent font-semibold transition-colors flex items-center gap-1">
                      เปิดอ่านบทนี้
                      <ChevronRight className="w-3 h-3" />
                    </span>
                    <span>อ่าน ~2-3 นาที</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
