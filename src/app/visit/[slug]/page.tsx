import Link from "next/link";
import { notFound } from "next/navigation";
import { getSetting } from "@/lib/data";
import { pageMetadata, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import { getVisitArticle, visitArticles } from "@/lib/visit-articles";

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return visitArticles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const article = getVisitArticle((await params).slug);
  if (!article) notFound();
  const image = article.image || await getSetting("home_about_image") || undefined;
  return pageMetadata(article.title, article.excerpt, `/visit/${article.slug}`, image, article.imageAlt);
}

export default async function VisitArticlePage({ params }: Props) {
  const article = getVisitArticle((await params).slug);
  if (!article) notFound();
  const image = article.image || await getSetting("home_about_image");
  const url = `${SITE_URL}/visit/${article.slug}`;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 font-thai">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
        "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title,
        description: article.excerpt, mainEntityOfPage: url, url,
        ...(image ? { image: new URL(image, SITE_URL).href } : {}),
        author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        inLanguage: "th", articleSection: article.category,
        ...(article.source ? { isBasedOn: article.source.url } : {}),
      }) }} />
      <nav aria-label="เส้นทางหน้าเว็บ" className="mb-6 text-sm text-accent"><Link href="/visit">← แวะลับแล</Link></nav>
      <article>
        <header className="space-y-4 mb-6">
          <p className="text-accent">{article.category}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-relaxed">{article.title}</h1>
          <p className="text-lg text-primary/75 leading-relaxed">{article.excerpt}</p>
        </header>
        {image && <img src={image} alt={article.imageAlt} className="w-full h-auto rounded-2xl mb-8" decoding="async" />}
        <div className="space-y-8">
          {article.sections.map((section) => <section key={section.heading} className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-primary leading-relaxed">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-primary/85 text-base sm:text-lg leading-[1.9]">{paragraph}</p>)}
          </section>)}
        </div>
        {article.source && <p className="mt-8 text-sm"><a href={article.source.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">{article.source.label} ↗</a></p>}
      </article>
      <aside className="mt-10 rounded-2xl border border-accent/30 bg-[#241710] p-5 sm:p-6">
        <h2 className="text-xl font-bold text-primary mb-4">เตรียมแวะมาหาเรา</h2>
        <div className="flex flex-wrap gap-3">
          {[['/menu', 'ดูเมนูและราคา'], ['/directions', 'แผนที่และเส้นทาง'], ['/#booking', 'จองโต๊ะ']].map(([href, label]) => <Link key={href} href={href} className="px-4 py-3 rounded-xl border border-accent/40 text-accent hover:bg-accent/10">{label}</Link>)}
        </div>
      </aside>
      <nav aria-label="เรื่องอื่นในแวะลับแล" className="mt-8 space-y-3">
        <h2 className="text-xl font-bold text-primary">อ่านต่อก่อนแวะมา</h2>
        {visitArticles.filter((other) => other.slug !== article.slug).map((other) => <Link key={other.slug} href={`/visit/${other.slug}`} className="block text-accent py-2">{other.title} →</Link>)}
      </nav>
    </div>
  );
}
