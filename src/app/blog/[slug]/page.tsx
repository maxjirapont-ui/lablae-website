import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/lib/data";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";

import type { Metadata } from "next";

export const revalidate = 0; // Disable static cache

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "ไม่พบบทความ | ร้านลำลำลับแลบ้าน 100 ปี",
    };
  }

  const title = `${article.title} | ตำราลับแลง ร้านลำลำลับแลบ้าน 100 ปี`;
  const description = article.excerpt || article.content.substring(0, 160).replace(/\n/g, " ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      locale: "th_TH",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Find previous and next chapters
  const allArticles = await getArticles();
  const currentIndex = allArticles.findIndex((a) => a.slug === slug);
  const prevChapter = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  // Process text paragraphs
  const renderParagraphs = (content: string) => {
    return content.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
        return (
          <li key={idx} className="font-thai text-sm sm:text-base text-[#f5ece1]/90 ml-6 list-disc mb-2 leading-relaxed">
            {trimmed.substring(2)}
          </li>
        );
      }

      if (trimmed.startsWith("“") || trimmed.startsWith("\"")) {
        return (
          <blockquote key={idx} className="font-thai text-base sm:text-lg font-bold text-primary my-4 pl-4 border-l-4 border-accent italic bg-[#1a100a]/60 p-4 rounded-r-xl">
            {trimmed}
          </blockquote>
        );
      }

      return (
        <p key={idx} className="font-thai text-sm sm:text-base text-[#f5ece1]/90 mb-4 leading-relaxed indent-4">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8 font-thai">
      {/* Back button */}
      <div className="flex justify-between items-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:brightness-110 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับสู่สารบัญตำราลับแลง
        </Link>
        <span className="text-[11px] text-primary/40">
          ตอนที่ {currentIndex + 1} จาก {allArticles.length}
        </span>
      </div>

      {/* Book Reader Card */}
      <article className="wood-card bg-[#241710] rounded-3xl p-6 sm:p-12 border border-accent/20 shadow-md space-y-8">
        {/* Chapter Header */}
        <div className="space-y-3 border-b border-accent/15 pb-6 text-center">
          {article.part_title && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-accent uppercase tracking-wider">
              <Bookmark className="w-3.5 h-3.5" />
              {article.part_title}
            </span>
          )}

          <h1 className="text-2xl sm:text-4xl font-bold text-primary leading-tight">
            {article.title}
          </h1>

          <div className="text-xs text-[#f5ece1]/50 pt-1">
            หนังสือ “ลับแลง — ตำราเล่าเรื่องแห่งเมืองที่อดีตยังกินได้” · ลำลำลับแล
          </div>
        </div>

        {/* Chapter Body */}
        <div className="text-justify pt-2">
          {renderParagraphs(article.content)}
        </div>

        {/* Signature Ornament */}
        <div className="text-center pt-6 pb-2 text-accent/50 text-xl tracking-widest">
          ❦
        </div>
      </article>

      {/* Chapter Pagination (Next / Previous) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        {prevChapter ? (
          <Link
            href={`/blog/${prevChapter.slug}`}
            className="p-4 rounded-2xl wood-card bg-[#241710] hover:bg-[#2d1d14] border border-accent/20 hover:border-accent/50 text-left space-y-1 transition-all group"
          >
            <span className="text-[11px] text-[#f5ece1]/50 flex items-center gap-1 group-hover:text-accent transition-colors">
              <ChevronLeft className="w-3 h-3" />
              บทก่อนหน้า
            </span>
            <p className="font-bold text-xs sm:text-sm text-primary group-hover:text-accent line-clamp-1">
              {prevChapter.title}
            </p>
          </Link>
        ) : (
          <div />
        )}

        {nextChapter && (
          <Link
            href={`/blog/${nextChapter.slug}`}
            className="p-4 rounded-2xl wood-card bg-[#241710] hover:bg-[#2d1d14] border border-accent/20 hover:border-accent/50 text-right space-y-1 transition-all group sm:col-start-2"
          >
            <span className="text-[11px] text-[#f5ece1]/50 flex items-center justify-end gap-1 group-hover:text-accent transition-colors">
              บทถัดไป
              <ChevronRight className="w-3 h-3" />
            </span>
            <p className="font-bold text-xs sm:text-sm text-primary group-hover:text-accent line-clamp-1">
              {nextChapter.title}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
