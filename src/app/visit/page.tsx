import Link from "next/link";
import { getSetting } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { visitArticles } from "@/lib/visit-articles";

export const revalidate = 3600;
export const metadata = pageMetadata("แวะลับแล เรื่องกินและเรื่องน่ารู้ก่อนมาร้าน", "เรื่องกิน ที่เที่ยว และเรื่องน่ารู้ก่อนมาหาเรา อ่านเรื่องจากเพจลำลำลับแล เลือกอาหาร วางแผนเดินทาง และเตรียมมาทานกับครอบครัว", "/visit");

export default async function VisitPage() {
  const houseImage = await getSetting("home_about_image");
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 font-thai">
      <header className="max-w-2xl mb-8 space-y-3">
        <p className="text-accent text-sm">จากเพจลำลำลับแล สู่เรื่องอ่านก่อนแวะมา</p>
        <h1 className="text-4xl sm:text-6xl font-bold text-primary">แวะลับแล</h1>
        <p className="text-lg text-primary/80">เรื่องกิน ที่เที่ยว และเรื่องน่ารู้ก่อนมาหาเรา</p>
        <p className="text-primary/65 leading-relaxed">มาสองคน มากับครอบครัว หรือกำลังหาเส้นทางเข้าร้าน ลองเลือกอ่านเรื่องที่อยากรู้ก่อนครับ</p>
      </header>
      <div className="grid md:grid-cols-2 gap-6">
        {visitArticles.map((article, index) => {
          const image = article.image || houseImage;
          return <Link key={article.slug} href={`/visit/${article.slug}`} className="group rounded-2xl overflow-hidden border border-accent/25 bg-[#241710] hover:border-accent/70 transition-colors">
            {image && <img src={image} alt={article.imageAlt} loading={index === 0 ? "eager" : "lazy"} decoding="async" className={`w-full aspect-[4/3] ${article.slug === "gaeng-kae-family-kitchen" ? "object-contain bg-[#190e08]" : "object-cover"}`} />}
            <div className="p-5 sm:p-6 space-y-3">
              <span className="text-sm text-accent">{article.category}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary group-hover:text-accent leading-relaxed">{article.title}</h2>
              <p className="text-primary/75 leading-relaxed">{article.excerpt}</p>
              <span className="inline-block text-accent pt-2">อ่านเรื่องนี้ →</span>
            </div>
          </Link>;
        })}
      </div>
      <aside className="mt-10 border-t border-accent/20 pt-6 text-primary/75 leading-relaxed">
        อยากอ่านเรื่องราวของเมืองและบันทึกครอบครัวต่อ <Link href="/blog" className="text-accent underline underline-offset-4">เปิดตำราลับแลง</Link>
      </aside>
    </div>
  );
}
