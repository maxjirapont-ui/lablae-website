import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  House,
  MapPin,
  Phone,
  UtensilsCrossed,
} from "lucide-react";
import { getSetting } from "@/lib/data";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";

export const revalidate = 0;

export const metadata = pageMetadata(
  "ลับแล อุตรดิตถ์ เมืองแห่งเรื่องเล่าและอาหารพื้นบ้าน",
  "รู้จักลับแล อุตรดิตถ์ ผ่านที่มาของชื่อ วิถีอาหารพื้นบ้าน รสชาติที่เชื่อมล้านนากับสุโขทัย พร้อมเมนู แผนที่ และเรื่องเล่าจากคนลับแล",
  "/lablae",
);

const stories = [
  {
    href: "/blog/chapter-2-three-theories-of-lablae",
    title: "3 คำอธิบายของชื่อ “ลับแล”",
    description: "อ่านตำนานและความหมายที่คนในพื้นที่เล่าต่อกันมา",
  },
  {
    href: "/blog/chapter-6-thung-yang-sukhothai-leg",
    title: "ทุ่งยั้งกับรากสุโขทัย",
    description: "อีกด้านของวัฒนธรรมที่เข้ามาพบกับล้านนาในเมืองนี้",
  },
  {
    href: "/blog/chapter-22-khao-phan-phak",
    title: "ข้าวพันผัก จานที่เล่าเมืองลับแล",
    description: "อาหารเรียบง่ายที่สะท้อนผักพื้นบ้านและวิถีครัวของคนลับแล",
  },
  {
    href: "/blog/chapter-25-first-generation-house-builders",
    title: "จุดเริ่มต้นของบ้าน 100 ปี",
    description: "เรื่องของพ่อขากลิ้ง แม่ขายอด และบ้านที่ครอบครัวยังดูแลอยู่",
  },
];

export default async function LablaePage() {
  const restaurantName =
    (await getSetting("restaurant_name")) || "ร้านลำลำลับแลบ้าน 100 ปี";
  const address =
    (await getSetting("address")) ||
    "ถนนสายของกินเมืองลับแล ต.ศรีพนมมาศ อ.ลับแล จ.อุตรดิตถ์";
  const hours =
    (await getSetting("hours")) || "เปิดทุกวัน 10.00 - 20.00 น.";
  const phone = (await getSetting("phone")) || "095-628-3125";
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/lablae#page`,
    url: `${SITE_URL}/lablae`,
    name: "ลับแล อุตรดิตถ์ เมืองแห่งเรื่องเล่าและอาหารพื้นบ้าน",
    description:
      "ข้อมูลเมืองลับแล ที่มาของชื่อ วิถีอาหารพื้นบ้าน และเรื่องเล่าจากครอบครัวลำลำลับแลบ้าน 100 ปี",
    inLanguage: "th-TH",
    about: {
      "@type": "Place",
      name: "อำเภอลับแล จังหวัดอุตรดิตถ์",
      address: {
        "@type": "PostalAddress",
        addressLocality: "ลับแล",
        addressRegion: "อุตรดิตถ์",
        addressCountry: "TH",
      },
    },
    publisher: { "@id": `${SITE_URL}/#restaurant` },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "รู้จักเมืองลับแล",
        item: `${SITE_URL}/lablae`,
      },
    ],
  };

  return (
    <main className="font-thai">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />

      <section className="border-b border-accent/20 bg-[radial-gradient(circle_at_top,rgba(212,163,115,0.18),transparent_60%)] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold tracking-widest text-accent">
            อำเภอลับแล จังหวัดอุตรดิตถ์
          </p>
          <h1 className="text-4xl font-bold leading-tight text-primary sm:text-6xl">
            ลับแล เมืองที่เรื่องเล่ายังอยู่ในอาหาร
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-primary/80 sm:text-lg">
            ลับแลเป็นอำเภอหนึ่งของจังหวัดอุตรดิตถ์ มีทั้งตำนานเมืองลับแล
            วิถีชุมชน และอาหารพื้นบ้านที่เกิดจากการพบกันของวัฒนธรรมล้านนาและสุโขทัย
            หน้านี้ชวนรู้จักลับแลผ่านเรื่องที่ครอบครัวเราเติบโตและใช้ชีวิตอยู่จริง
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/directions"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-[#1a100a] transition hover:brightness-110"
            >
              <MapPin className="h-4 w-4" />
              แผนที่มาร้านที่ลับแล
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/50 px-6 py-3 font-bold text-accent transition hover:bg-accent/10"
            >
              <UtensilsCrossed className="h-4 w-4" />
              ดูอาหารเมืองลับแล
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-3">
        <article className="wood-card rounded-2xl p-6">
          <MapPin className="mb-4 h-7 w-7 text-accent" />
          <h2 className="text-xl font-bold text-primary">ลับแลอยู่ที่ไหน</h2>
          <p className="mt-3 text-sm leading-7 text-primary/75">
            ลับแลเป็นอำเภอในจังหวัดอุตรดิตถ์ ภาคเหนือของไทย
            คนมาเที่ยวมักแวะหาของกินพื้นบ้าน ชมวิถีชุมชน และฟังเรื่องเล่าของเมือง
          </p>
        </article>
        <article className="wood-card rounded-2xl p-6">
          <BookOpen className="mb-4 h-7 w-7 text-accent" />
          <h2 className="text-xl font-bold text-primary">ทำไมชื่อเมืองลับแล</h2>
          <p className="mt-3 text-sm leading-7 text-primary/75">
            มีคำอธิบายเล่าต่อกันมาหลายแบบ ทั้งตำนานเมืองที่คนต่างถิ่นหาทางเข้าได้ยาก
            และคำว่า “ลับแลง” ที่เกี่ยวกับแสงยามเย็น จึงควรอ่านในฐานะเรื่องเล่าท้องถิ่น ไม่ใช่ข้อสรุปเพียงแบบเดียว
          </p>
        </article>
        <article className="wood-card rounded-2xl p-6">
          <UtensilsCrossed className="mb-4 h-7 w-7 text-accent" />
          <h2 className="text-xl font-bold text-primary">รสชาติของลับแล</h2>
          <p className="mt-3 text-sm leading-7 text-primary/75">
            อาหารของครอบครัวเรามีทั้งน้ำพริก แกงฮังเล ข้าวพันผัก ไข่ป่าม
            และสำรับขันโตก เป็นรสที่ส่งต่อกันมา 4 รุ่นและทำพริกแกงกันเองในครัว
          </p>
        </article>
      </section>

      <section className="border-y border-accent/15 bg-[#21150e] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold text-accent">จากเมืองสู่สำรับ</p>
            <h2 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              ล้านนาและสุโขทัยมาพบกันที่ลับแล
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-primary/80">
              <p>
                ลับแลอยู่ในพื้นที่ที่เรื่องเล่าจากล้านนาและสุโขทัยเดินทางมาพบกัน
                สำหรับครอบครัวเรา ความผสมผสานนั้นมองเห็นได้ชัดที่สุดในสำรับอาหาร
                ทั้งเครื่องแกง น้ำพริก ผักพื้นบ้าน และวิธีปรุงที่คนในบ้านสอนต่อกันมา
              </p>
              <p>
                ร้านลำลำลับแลจึงไม่ได้ทำอาหารเหนือแบบกว้าง ๆ เท่านั้น
                แต่เล่า “รสลับแล” จากความทรงจำของคนในครอบครัว 4 รุ่น
                ตั้งแต่พริกแกงทำเองไปจนถึงแกงฮังเลที่ค่อย ๆ ปรุงด้วยเตาถ่าน
              </p>
            </div>
            <Link
              href="/menu"
              className="mt-6 inline-flex items-center gap-2 font-bold text-accent hover:underline"
            >
              เปิดดูเมนูและราคาปัจจุบัน <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-3xl border border-accent/25 bg-[#180f0a] p-7 sm:p-9">
            <House className="h-9 w-9 text-accent" />
            <h2 className="mt-5 text-2xl font-bold text-primary">บ้านไม้ที่อยู่กับครอบครัวมากว่า 100 ปี</h2>
            <p className="mt-4 leading-8 text-primary/75">
              บ้านหลังนี้สร้างโดยพ่อขากลิ้ง บรรพบุรุษของครอบครัว
              ใช้วิธีเข้าไม้แบบดั้งเดิมโดยไม่ใช้ตะปู ปัจจุบันชั้นล่างเป็นร้านอาหาร
              ส่วนเรื่องของบ้าน ข้าวของ และคนรุ่นก่อนยังถูกดูแลและเล่าต่อ
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 font-bold text-accent hover:underline"
            >
              รู้จักบ้าน 100 ปี <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-accent">ตำราลับแลง</p>
          <h2 className="mt-2 text-3xl font-bold text-primary">อ่านเรื่องลับแลต่อจากคนในพื้นที่</h2>
          <p className="mt-3 leading-7 text-primary/70">
            เรื่องเหล่านี้เป็นบันทึกจากประวัติครอบครัว ความทรงจำในครัว และเรื่องเล่าที่สืบต่อกันมาในชุมชน
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => (
            <Link
              key={story.href}
              href={story.href}
              className="group rounded-2xl border border-accent/20 bg-[#241710] p-6 transition hover:border-accent/55 hover:bg-[#2b1b12]"
            >
              <h3 className="flex items-center justify-between gap-4 text-lg font-bold text-primary group-hover:text-accent">
                {story.title}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </h3>
              <p className="mt-2 text-sm leading-7 text-primary/70">{story.description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-7 text-center">
          <Link href="/blog" className="font-bold text-accent hover:underline">
            อ่านตำราลับแลงทั้งหมด
          </Link>
        </div>
      </section>

      <section className="border-t border-accent/15 bg-[#21150e] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 rounded-3xl border border-accent/25 bg-[#180f0a] p-7 sm:p-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold text-accent">วางแผนแวะลับแล</p>
              <h2 className="mt-2 text-3xl font-bold text-primary">มากินข้าวที่ {restaurantName}</h2>
              <p className="mt-4 max-w-xl leading-8 text-primary/75">
                ร้านอยู่ใต้ถุนบ้านไม้ 100 ปีในอำเภอลับแล แวะมาเป็นครอบครัว
                กลุ่มเพื่อน หรือจองโต๊ะล่วงหน้าได้จากหน้าแรกของเว็บ
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/directions"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-[#1a100a]"
                >
                  <MapPin className="h-4 w-4" /> แผนที่และเส้นทาง
                </Link>
                <Link
                  href="/#booking"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/50 px-6 py-3 font-bold text-accent"
                >
                  จองโต๊ะล่วงหน้า
                </Link>
              </div>
            </div>
            <dl className="space-y-5 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <dt className="font-bold text-primary">ที่อยู่</dt>
                  <dd className="mt-1 leading-6 text-primary/70">{address}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <dt className="font-bold text-primary">เวลาเปิดร้าน</dt>
                  <dd className="mt-1 text-primary/70">{hours}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <dt className="font-bold text-primary">โทรสอบถาม</dt>
                  <dd className="mt-1">
                    <a href={phoneHref} className="text-accent hover:underline">{phone}</a>
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <p className="mt-8 text-center text-xs leading-6 text-primary/50">
            แหล่งอ่านเพิ่มเติมเกี่ยวกับเมืองและจังหวัด:{" "}
            <a
              href="https://wikicommunity.sac.or.th/community/1757"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/65 underline hover:text-accent"
            >
              ฐานข้อมูลชุมชน ศูนย์มานุษยวิทยาสิรินธร
            </a>{" "}
            และ{" "}
            <a
              href="https://thai.tourismthailand.org/Destinations/Provinces/%E0%B8%AD%E0%B8%B8%E0%B8%95%E0%B8%A3%E0%B8%94%E0%B8%B4%E0%B8%95%E0%B8%96%E0%B9%8C/117"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/65 underline hover:text-accent"
            >
              การท่องเที่ยวแห่งประเทศไทย
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
