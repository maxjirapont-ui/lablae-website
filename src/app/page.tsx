import React from "react";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getSetting, MenuItem } from "@/lib/data";
import BookingForm from "@/components/BookingForm";
import QuickFactsStoryModal from "@/components/QuickFactsStoryModal";
import { Clock, Phone, MapPin, Sparkles, BookOpen, Utensils, Heart, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Dynamic on request
export const metadata = pageMetadata(
  "ลำลำลับแลบ้าน 100 ปี | ร้านอาหารลับแล อุตรดิตถ์",
  "ลำลำลับแลบ้าน 100 ปี ร้านอาหารพื้นเมืองในอำเภอลับแล จังหวัดอุตรดิตถ์ อาหารเหนือสูตรครอบครัว 4 รุ่น พริกแกงทำเอง ดูเมนูขันโตก แผนที่ และจองโต๊ะออนไลน์",
  "/",
);
const HOMEPAGE_FEATURED_LIMIT = 3;

// Server component fetching featured dishes
async function getFeaturedDishes(): Promise<MenuItem[]> {
  try {
    const db = await getDb();

    // Check if custom ordered list of featured menu IDs is set
    const rawFeaturedIds = await getSetting("homepage_featured_menu_ids");
    if (rawFeaturedIds) {
      try {
        const ids: number[] = JSON.parse(rawFeaturedIds);
        if (Array.isArray(ids) && ids.length > 0) {
          const placeholders = ids.map(() => "?").join(",");
          const rows = await db.all<MenuItem[]>(
            `SELECT * FROM menus WHERE id IN (${placeholders}) AND is_visible = 1`,
            ids
          );
          const dishMap = new Map(rows.map((r) => [r.id, r]));
          const sorted = ids.map((id) => dishMap.get(id)).filter((d): d is MenuItem => Boolean(d));
          if (sorted.length > 0) return sorted.slice(0, HOMEPAGE_FEATURED_LIMIT);
        }
      } catch (err) {
        console.error("Error parsing homepage_featured_menu_ids:", err);
      }
    }

    // First, try to fetch user-defined recommended dishes ordered by sort_order
    let dishes = await db.all<MenuItem[]>(
      `SELECT * FROM menus 
       WHERE is_recommended = 1 AND is_visible = 1
       ORDER BY sort_order ASC, id ASC
       LIMIT ${HOMEPAGE_FEATURED_LIMIT}`
    );
    // If none are flagged, fallback to default recommended ones
    if (dishes.length === 0) {
      dishes = await db.all<MenuItem[]>(
        `SELECT * FROM menus 
         WHERE name IN ('หมูทอดลับแลพริกข่า', 'อ่องมันปู', 'ไส้อั่วสมุนไพรย่าง', 'น้ำพริกหนุ่ม', 'น้ำพริกอ่อง', 'ข้าวพันผัก', 'ขันโตกบ้าน 100 ปี โตกหมูฮังเล', 'ไข่ป่าม', 'ไส้อั่วลับแล')
         AND is_visible = 1
         ORDER BY sort_order ASC, id ASC
         LIMIT ${HOMEPAGE_FEATURED_LIMIT}`
      );
    }
    return dishes;
  } catch (err) {
    console.error("Error fetching featured dishes:", err);
    return [];
  }
}

// Server component fetching seasonal dishes
async function getSeasonalDishes(): Promise<MenuItem[]> {
  try {
    const db = await getDb();
    // Try to fetch user-defined seasonal dishes ordered by sort_order
    let dishes = await db.all<MenuItem[]>(
      `SELECT * FROM menus 
       WHERE is_seasonal = 1 AND is_visible = 1
       ORDER BY sort_order ASC, id ASC
       LIMIT 12`
    );
    // If none are flagged, fallback to other common items
    if (dishes.length === 0) {
      dishes = await db.all<MenuItem[]>(
        `SELECT * FROM menus 
         WHERE category IN ('อาหารพื้นบ้าน', 'เซทขันโตก')
         AND is_visible = 1
         ORDER BY sort_order ASC, id ASC
         LIMIT 8`
      );
    }
    return dishes;
  } catch (err) {
    console.error("Error fetching seasonal dishes:", err);
    return [];
  }
}

export default async function Home() {
  const featured = await getFeaturedDishes();
  const seasonal = await getSeasonalDishes();

  // Dynamic Settings
  const restaurantName = await getSetting("restaurant_name") || "ร้านลำลำลับแลบ้าน 100 ปี";
  const restaurantDesc = await getSetting("restaurant_desc") || "อาหารที่บ้านเราคือการผสมผสานวัฒนธรรม สุโขทัยและล้านนา มรดกตกทอดจากสูตรของทวดกว่า 100 ปี";
  const heroImage = await getSetting("home_hero_image") || "https://lh3.googleusercontent.com/sitesv/AA5AbUBtBaZCAX-9g_MZWwNQqvEX6s88oX2eQ8flnpJYsoyFpI7B3ZTMEW3UBdmpNW6VQNI88JEjwbdriszJXS-2j-NhH0Zl5rSbZyXB4F-3sz5S6Ib3EYTV2fZGGKFpMU1x0QdtSqabAmjzbpljKB1IneR9V9gGou-HuVQy9GTJlOti6Yt0Jb1g1U9QCwo=w16383";
  const aboutImage = await getSetting("home_about_image") || "https://lh3.googleusercontent.com/sitesv/AA5AbUBv9WREClQayfZ7COMLiB91ilUHfEaJefV-DkYOhJLfhpHlbdpnWtZ-s4YnEidqkx8kEnBAQldI3t5Tokl-EMA6k6iY9pNIXI5_-QNGPMUbxcrtWZYB439lqAW0Qt-Hh2Xly7sB2KP7vlppjntbXUXmYriHo_ir0XvRKtNC9UAZtwLkkc4nEflbQ7MdVyCIuxdM213VLqZr1KPB";
  const phone = await getSetting("phone") || "095-628-3125";
  const hours = await getSetting("hours") || "เปิดทุกวัน 10.00 - 20.00 น.";
  const address = await getSetting("address") || "ถนนสายของกินเมืองลับแล, ต.ศรีพนมมาศ, อ.ลับแล, จ.อุตรดิตถ์";
  const googleMapsUrl = await getSetting("google_maps_url") || "https://maps.app.goo.gl/8xsKvMFqaAMfE3K87";
  const facebookUrl = await getSetting("facebook_url") || "https://www.facebook.com/lumlumlablae/";
  const tiktokUrl = await getSetting("tiktok_url") || "https://www.tiktok.com/@lumlumlablae1";
  const googleReviewsUrl = await getSetting("google_reviews_url") || "https://maps.app.goo.gl/HQpRWVM8qFobGHxL6?g_st=ic";
  const youtubeUrl = await getSetting("youtube_url") || "https://www.youtube.com/@ร้านอาหารเมืองลับแล";

  // Dynamic Button Configurations
  const heroBtn1Text = await getSetting("hero_btn1_text") || "ดูเมนูอาหารทั้งหมด";
  const heroBtn1Link = await getSetting("hero_btn1_link") || "/menu";
  const heroBtn2Text = await getSetting("hero_btn2_text") || "รู้จักบ้านและเรื่องเล่าลับแล";
  const heroBtn2Link = await getSetting("hero_btn2_link") || "/about";
  const featuredBtnText = await getSetting("featured_btn_text") || "ดูเมนูแนะนำทั้งหมด →";
  const featuredBtnLink = await getSetting("featured_btn_link") || "/menu?category=เมนูแนะนำ";
  const seasonalBtnText = await getSetting("seasonal_btn_text") || "ดูเมนูตามฤดูกาลทั้งหมด →";
  const seasonalBtnLink = await getSetting("seasonal_btn_link") || "/menu?category=อาหารตามฤดูกาล";
  const contactBtnText = await getSetting("contact_btn_text") || "เปิดเส้นทางใน Google Maps";

  // Section Headers & Teasers
  const featuredBadge = (await getSetting("home_featured_badge")) || "ของกิ๋นลำเมืองลับแล";
  const featuredTitle = (await getSetting("home_featured_title")) || "จานเด็ดประจำบ้าน ที่อยากให้ลองชิม";

  const seasonalBadge = (await getSetting("home_seasonal_badge")) || "ของอร่อยตามฤดูกาล";
  const seasonalTitle = (await getSetting("home_seasonal_title")) || "วัตถุดิบสดใหม่ รสชาติตามฤดู";

  const bookBadge = (await getSetting("home_book_badge")) || "บันทึกเรื่องเล่าเมืองลับแล";
  const bookTitle = (await getSetting("home_book_title")) || "ตำราลับแลง (32 ตอน)";
  const bookDescription = (await getSetting("home_book_description")) || "เรื่องเล่าของคน 4 รุ่น บันทึกครัวโบราณ ที่มาของข้าวพันผัก พริกแกงทำเอง และวิถีชีวิตคนเมืองลับแลที่เขียนส่งต่อจากใจ";
  const bookBtnText = (await getSetting("home_book_btn_text")) || "เปิดอ่านตำราลับแลง (32 ตอน)";

  // Testimonial Card
  const testimonialBadge = (await getSetting("home_testimonial_badge")) || "★ Google Maps";
  const testimonialSubBadge = (await getSetting("home_testimonial_subbadge")) || "รีวิวจากลูกค้า";
  const testimonialText = (await getSetting("home_testimonial_text")) || "อาหารรสชาติดีมาก บรรยากาศร่มรื่น นั่งกินข้าวในบ้านไม้โบราณแล้วรู้สึกอบอุ่น ข้าวพันผักเหนียวนุ่มอร่อยมาก แนะนำเลยค่ะ!";
  const testimonialAuthor = (await getSetting("home_testimonial_author")) || "- รีวิวจากลูกค้าบน Google Maps";
  const testimonialBtnText = (await getSetting("home_testimonial_btn_text")) || "อ่านรีวิวบน Google Maps →";

  // Hero Section Customizable Texts & Descriptions
  const heroBadge = (await getSetting("hero_badge")) || "บ้านไม้ 100 ปีไร้ตะปู · อ.ลับแล จ.อุตรดิตถ์";
  const heroTitle = (await getSetting("hero_title")) || "ร้านลำลำลับแลบ้าน 100 ปี";
  const heroSubtitle = (await getSetting("hero_subtitle")) || "กับข้าวรสมือครอบครัว ใต้ถุนเรือนไม้ไร้ตะปู";
  const heroDescription = (await getSetting("hero_description")) || "อาหารพื้นเมืองลับแลดั้งเดิม พริกแกงทำเอง ข้าวพันผัก และชุดขันโตกสูตรโบราณ 4 รุ่น แวะมากินข้าวบ้านญาตินะครับ";

  // About / Story Ambience Section Customizable Texts
  const aboutImageCaption = (await getSetting("home_about_image_caption")) || "บรรยากาศร้านลำลำลับแล ใต้ถุนบ้านไม้ 100 ปี";
  const aboutBadge = (await getSetting("about_badge")) || "เรื่องเล่าจากบ้าน 100 ปี";
  const aboutTitle = (await getSetting("about_title")) || "บ้านหลังนี้คือบ้านของครอบครัวเราจริง ๆ";
  const aboutQuote = (await getSetting("about_quote")) || "“นี่คือรสมือครอบครัวเรา ไม่ได้อวดว่าเลิศที่สุด แต่รับรองว่าเป็นของจริง ที่เรากินกันมาตั้งแต่ทวด”";
  const aboutQuoteAuthor = (await getSetting("about_quote_author")) || "— คำของตาเงิน–ยายจัน และคนทำครัวบ้าน 100 ปี";
  const rawAboutStory = await getSetting("about_story_text");
  let aboutParagraphs: string[] = [
    "อายุกว่าร้อยปี ทวดเราสร้างไว้โดยไม่ใช้ตะปูเลยสักตัว ไม้ทุกแผ่นเข้าเดือยกันเองแบบช่างสมัยก่อน เราโตมากับบ้านหลังนี้ กินข้าวที่ตายายทำแทบทุกวัน",
    "ลับแลเป็นเมืองที่ซ่อนตัวอยู่ในหุบเขา ทางเหนือหัวดงพูดคำเมืองแบบล้านนา ทางใต้แถบทุ่งยั้งสืบสำเนียงสุโขทัย สองสายวัฒนธรรมอยู่ร่วมกันมาหลายร้อยปี จนเกิดเป็นรสชาติที่ไม่ใช่เหนือแท้ ไม่ใช่กลางแท้ แต่เป็นของที่นี่ ของลับแลเท่านั้น",
    "จานที่คุณสั่ง ล้วนสืบมาจากครัวของตากับยาย พริกแกงป้าชุมกับป้าชิดยังทำเองทุกวัน ไม่ใช้ของสำเร็จเลยสักอย่าง สมุนไพรเราก็ช่วยกันปลูกหลังบ้านและในชุมชน แวะมากินข้าวที่นี่ เหมือนมากินข้าวบ้านญาติครับ",
  ];
  if (rawAboutStory && rawAboutStory.trim()) {
    const split = rawAboutStory.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    if (split.length > 0) aboutParagraphs = split;
  }

  // Custom Stories Data for 4 Quick Facts
  const rawCustomStories = await getSetting("custom_stories_data");
  let customStoriesData = undefined;
  try {
    if (rawCustomStories) {
      customStoriesData = JSON.parse(rawCustomStories);
    }
  } catch {}

  // Web Layout & Sections customizability
  const showIntro = (await getSetting("home_section_intro_show")) !== "0";
  const showFeatured = (await getSetting("home_section_featured_show")) !== "0";
  const showSeasonal = (await getSetting("home_section_seasonal_show")) !== "0";
  const showSocial = (await getSetting("home_section_social_show")) !== "0";
  const showContact = (await getSetting("home_section_contact_show")) !== "0";
  const rawOrder = (await getSetting("homepage_sections_order")) || "featured,seasonal,intro,book,booking,social,contact";
  const sections = rawOrder.split(",").map(s => s.trim()).filter(s => s && s !== "gallery");
  if (!sections.includes("book")) {
    sections.push("book");
  }
  if (!sections.includes("booking")) {
    const contactIdx = sections.indexOf("contact");
    if (contactIdx !== -1) {
      sections.splice(contactIdx, 0, "booking");
    } else {
      sections.push("booking");
    }
  }

  return (
    <div className="flex flex-col space-y-20 pb-20">
      {/* 1. Hero Section (Always on Top) */}
      <section 
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        {/* Soft atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#1a100a]" />

        <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6 z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent border border-accent/35 text-xs sm:text-sm font-thai font-medium tracking-wide backdrop-blur-xs">
            <Sparkles className="w-4 h-4" />
            {heroBadge}
          </span>
          
          <h1 className="font-thai font-bold text-3xl sm:text-5xl lg:text-6xl text-[#fff8ee] tracking-wide leading-tight drop-shadow-lg">
            {heroTitle}
            {heroSubtitle && (
              <span className="block text-xl sm:text-2xl lg:text-3xl text-accent font-normal mt-2 drop-shadow-md">
                {heroSubtitle}
              </span>
            )}
          </h1>
          
          <p className="font-thai text-sm sm:text-base text-[#f7eee3]/90 max-w-xl mx-auto leading-relaxed drop-shadow-md">
            {heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md mx-auto">
            <Link
              href={heroBtn1Link}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-accent to-[#e6b87d] hover:brightness-110 text-[#1a100a] font-thai font-bold rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-sm text-center"
            >
              {heroBtn1Text}
            </Link>
            <Link
              href={heroBtn2Link}
              className="w-full sm:w-auto px-8 py-3.5 border-2 border-accent/60 hover:bg-accent hover:border-accent hover:text-[#1a100a] text-[#f7eee3] font-thai font-semibold rounded-full transition-all duration-300 text-sm backdrop-blur-xs text-center"
            >
              {heroBtn2Text}
            </Link>
          </div>

          {/* Quick Booking Callout */}
          <div className="pt-1">
            <Link
              href="/#booking"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 border border-accent/40 text-xs sm:text-sm text-accent hover:text-white transition-all font-thai font-medium backdrop-blur-xs shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>จองโต๊ะล่วงหน้าได้ที่นี่</span>
              <span className="text-accent">↓</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Render Dynamic Reorderable Sections */}
      {sections.map((sectionKey) => {
        if (sectionKey === "intro" && showIntro) {
          return (
            <section key="intro" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-accent font-bold text-sm tracking-wider uppercase font-thai">
                      {aboutBadge}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold font-thai text-primary leading-tight">
                      {aboutTitle}
                    </h2>
                  </div>

                  {/* Ancestor Quote Callout */}
                  {aboutQuote && (
                    <blockquote className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-accent/15 via-[#261810] to-accent/10 border-l-4 border-accent text-xs sm:text-sm font-thai italic text-[#f7eee3]/95 leading-relaxed shadow-xs">
                      {aboutQuote}
                      {aboutQuoteAuthor && (
                        <span className="block not-italic font-semibold text-accent text-xs mt-1.5 text-right">
                          {aboutQuoteAuthor}
                        </span>
                      )}
                    </blockquote>
                  )}

                  {/* 4 Interactive Quick Facts of the 100-Year House with Story Modals */}
                  <QuickFactsStoryModal customStoriesData={customStoriesData} />

                  <div className="font-thai text-sm sm:text-base text-[#f5ece1]/85 leading-relaxed space-y-3">
                    {aboutParagraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-accent/15 rounded-xl text-accent">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-accent/80 font-thai">เปิดให้บริการ</p>
                        <p className="text-sm font-semibold font-thai text-[#f5ece1]">{hours}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-accent/15 rounded-xl text-accent">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-accent/80 font-thai">เบอร์ติดต่อจองโต๊ะ</p>
                        <p className="text-sm font-semibold font-thai text-[#f5ece1]">{phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Image Section with Caption */}
                <div className="relative group rounded-3xl overflow-hidden shadow-lg aspect-video md:aspect-auto md:h-80 border border-primary/5">
                  <img 
                    src={aboutImage} 
                    alt={aboutImageCaption || "บรรยากาศร้านลำลำลับแล"} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                  {aboutImageCaption && (
                    <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end">
                      <p className="text-xs sm:text-sm font-thai text-[#f7eee3] font-medium drop-shadow-md">
                        {aboutImageCaption}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        if (sectionKey === "featured" && showFeatured && featured.length > 0) {
          return (
            <section key="featured" className="bg-[#20140c] py-16 border-y border-accent/15">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="text-center space-y-2">
                  <span className="text-accent font-bold text-sm tracking-wider uppercase font-thai">
                    {featuredBadge}
                  </span>
                  <h2 className="text-3xl font-bold font-thai text-primary">
                    {featuredTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featured.map((dish) => (
                    <div key={dish.id} className="wood-card rounded-2xl overflow-hidden flex flex-col h-full bg-[#261810]">
                      {dish.image_url && dish.image_url.trim() !== "" && (
                        <div className="relative h-40 w-full overflow-hidden border-b border-accent/15">
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-thai font-semibold border border-accent/25">
                            {dish.category}
                          </span>
                          <h3 className="font-thai font-bold text-base text-primary mt-2 line-clamp-1">
                            {dish.name}
                          </h3>
                          {dish.description && (
                            <p className="font-thai text-xs text-[#f5ece1]/70 line-clamp-3 mt-1 leading-relaxed">
                              {dish.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-accent/15">
                          <span className="font-thai text-xs text-[#f5ece1]/60">ราคาเริ่มต้น</span>
                          <span className="font-thai font-bold text-base text-accent">
                            ฿{dish.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4">
                  <Link
                    href={featuredBtnLink}
                    className="inline-flex items-center font-thai text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
                  >
                    {featuredBtnText}
                  </Link>
                </div>
              </div>
            </section>
          );
        }

        if (sectionKey === "book") {
          return (
            <section key="book" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-gradient-to-r from-[#2c1a10] via-[#20120a] to-[#2c1a10] text-[#f7eee3] p-8 sm:p-12 shadow-xl border border-accent/25 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="space-y-4 max-w-xl text-center md:text-left">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-thai font-medium border border-accent/30 tracking-wide">
                    <BookOpen className="w-3.5 h-3.5" />
                    {bookBadge}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold font-thai text-[#f7eee3] leading-tight">
                    {bookTitle}
                  </h2>
                  <p className="font-thai text-xs sm:text-sm text-[#f7eee3]/80 leading-relaxed">
                    {bookDescription}
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/blog"
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent hover:brightness-110 text-[#1a100a] rounded-full font-thai text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
                    >
                      <span>{bookBtnText}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 max-w-xs text-xs font-thai">
                  <div className="p-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10 space-y-1">
                    <span className="text-accent text-[10px] font-bold">ภาคที่ 1</span>
                    <p className="font-bold text-white text-xs">แผ่นดินที่ซ่อนตัว</p>
                    <p className="text-[10px] text-cream/70">ภูเขา ตำนาน และคำสัตย์</p>
                  </div>
                  <div className="p-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10 space-y-1">
                    <span className="text-accent text-[10px] font-bold">ภาคที่ 2</span>
                    <p className="font-bold text-white text-xs">เมืองที่ทัพต้องยั้ง</p>
                    <p className="text-[10px] text-cream/70">คำตอบของยายจัน</p>
                  </div>
                  <div className="p-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10 space-y-1">
                    <span className="text-accent text-[10px] font-bold">ภาคที่ 3</span>
                    <p className="font-bold text-white text-xs">จากดินสู่ครก</p>
                    <p className="text-[10px] text-cream/70">มะแขว่น & ผักริมรั้ว</p>
                  </div>
                  <div className="p-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10 space-y-1">
                    <span className="text-accent text-[10px] font-bold">ภาคที่ 4 & 5</span>
                    <p className="font-bold text-white text-xs">สำรับ & เรือนไม้</p>
                    <p className="text-[10px] text-cream/70">ข้าวพันผัก & คน 4 รุ่น</p>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (sectionKey === "seasonal" && showSeasonal && seasonal.length > 0) {
          return (
            <section key="seasonal" className="py-16 border-y border-accent/15 bg-[#20140c]">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="text-center space-y-2">
                  <span className="text-accent font-bold text-sm tracking-wider uppercase font-thai">
                    {seasonalBadge}
                  </span>
                  <h2 className="text-3xl font-bold font-thai text-primary">
                    {seasonalTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {seasonal.map((dish) => (
                    <div key={dish.id} className="wood-card rounded-2xl overflow-hidden flex flex-col h-full bg-[#261810]">
                      {dish.image_url && dish.image_url.trim() !== "" && (
                        <div className="relative h-40 w-full overflow-hidden border-b border-accent/15">
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-thai font-semibold border border-accent/25">
                              {dish.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 text-[9px] font-thai font-semibold">
                              ตามฤดูกาล
                            </span>
                          </div>
                          <h3 className="font-thai font-bold text-base text-primary mt-2 line-clamp-1">
                            {dish.name}
                          </h3>
                          {dish.description && (
                            <p className="font-thai text-xs text-[#f5ece1]/70 line-clamp-3 mt-1 leading-relaxed">
                              {dish.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-accent/15">
                          <span className="font-thai text-xs text-[#f5ece1]/60">ราคาเริ่มต้น</span>
                          <span className="font-thai font-bold text-base text-accent">
                            ฿{dish.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4">
                  <Link
                    href={seasonalBtnLink}
                    className="inline-flex items-center font-thai text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
                  >
                    {seasonalBtnText}
                  </Link>
                </div>
              </div>
            </section>
          );
        }

        if (sectionKey === "social" && showSocial) {
          return (
            <section key="social" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="wood-card bg-[#241710] border border-accent/20 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl space-y-8">
                <div className="text-center space-y-2 border-b border-accent/15 pb-6">
                  <span className="text-accent font-bold text-xs tracking-wider uppercase font-thai">
                    โซเชียลมีเดีย
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-thai text-primary">
                    ติดตามบรรยากาศและเรื่องราวของบ้านเรา
                  </h2>
                  <p className="font-thai text-xs sm:text-sm text-[#f5ece1]/70 max-w-xl mx-auto">
                    อัปเดตเมนูประจำวัน กิจกรรม และภาพบรรยากาศอบอุ่นจากเรือนไม้ 100 ปี
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* Left side: Live Facebook feed */}
                  <div className="lg:col-span-5 w-full flex flex-col">
                    <h3 className="font-thai font-bold text-base text-primary mb-4 flex items-center gap-2 shrink-0 border-b border-accent/15 pb-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      ความเคลื่อนไหวทาง Facebook
                    </h3>
                    <div className="flex-grow w-full overflow-hidden flex items-center justify-center h-[360px] min-h-[360px] max-w-full bg-[#1a100a] rounded-2xl border border-accent/20 p-2">
                      {facebookUrl ? (
                        <iframe 
                          src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookUrl)}&tabs=timeline&width=340&height=360&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`} 
                          width="100%" 
                          height="360" 
                          style={{ border: "none", overflow: "hidden", height: "360px", minHeight: "360px", maxWidth: "100%", width: "100%" }}
                          scrolling="no" 
                          frameBorder="0" 
                          allowFullScreen={true} 
                          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        ></iframe>
                      ) : (
                        <div className="text-accent/60 text-sm font-thai p-6 text-center">
                          ยังไม่มีลิงก์เพจ Facebook ในระบบ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Social gallery cards with vertical divider on large screens */}
                  <div className="lg:col-span-7 flex flex-col justify-between lg:border-l lg:border-accent/15 lg:pl-8">
                    <h3 className="font-thai font-bold text-base text-primary mb-4 flex items-center gap-2 shrink-0 border-b border-accent/15 pb-2">
                      <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                      ช่องทางติดตามและรีวิวร้าน
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                      {/* Highlight Card 1: TikTok menu */}
                      <a 
                        href={tiktokUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col justify-between p-4 rounded-2xl bg-[#1a100a]/70 border border-accent/15 hover:border-accent/40 hover:bg-[#1a100a] transition-all duration-300 group"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-semibold flex items-center gap-1 border border-white/20">
                              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.63 4.14 1.13 1.2 2.68 1.9 4.31 2.01v3.9c-1.85-.02-3.61-.75-4.96-2.02-.13-.13-.26-.27-.38-.41v6.98c.01 4.14-2.88 7.82-6.94 8.79-4.73 1.23-9.56-1.57-10.74-6.3-1.18-4.73 1.59-9.56 6.32-10.74 1.5-.38 3.08-.29 4.52.27v4.19c-1.13-.7-2.58-.75-3.76-.13-1.46.77-2.14 2.53-1.54 4.1.6 1.56 2.33 2.35 3.92 1.83 1.45-.48 2.39-1.88 2.39-3.41V.02Z"/></svg>
                              TikTok
                            </span>
                            <span className="text-[10px] text-[#f5ece1]/50">@lumlumlablae1</span>
                          </div>
                          <div className="aspect-video relative rounded-lg overflow-hidden border border-accent/15">
                            <img src={aboutImage} alt="TikTok Highlight" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <div className="w-10 h-10 bg-white/95 rounded-full flex items-center justify-center text-primary shadow-lg">
                                <svg className="w-4 h-4 fill-primary ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-[#f5ece1] line-clamp-2">
                            ชมคลิปบรรยากาศใต้ถุนเรือนไม้ 100 ปี และวิธีทำข้าวพันผักเมืองลับแล
                          </p>
                        </div>
                        <span className="text-[10px] text-accent font-semibold mt-4 block">กดไปดูคลิป TikTok →</span>
                      </a>

                      {/* Highlight Card 2: Facebook Review */}
                      <a 
                        href={facebookUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col justify-between p-4 rounded-2xl bg-[#1a100a]/70 border border-accent/15 hover:border-accent/40 hover:bg-[#1a100a] transition-all duration-300 group"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                              Facebook
                            </span>
                            <span className="text-[10px] text-[#f5ece1]/50">เพจทางการ</span>
                          </div>
                          <div className="aspect-video relative rounded-lg overflow-hidden border border-accent/15">
                            <img src={heroImage} alt="Facebook Highlight" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                          </div>
                          <p className="text-xs font-semibold text-[#f5ece1] line-clamp-2">
                            ติดตามข่าวสาร เมนูพิเศษประจำวัน และภาพบรรยากาศร้าน
                          </p>
                        </div>
                        <span className="text-[10px] text-accent font-semibold mt-4 block">เปิดดูเพจ Facebook →</span>
                      </a>

                      {/* Highlight Card 3: Google reviews */}
                      <a 
                        href={googleReviewsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col justify-between p-4 rounded-2xl bg-[#1a100a]/70 border border-accent/15 hover:border-accent/40 hover:bg-[#1a100a] transition-all duration-300 group"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/50 text-[10px] font-semibold flex items-center gap-1">
                              {testimonialBadge}
                            </span>
                            <span className="text-[10px] text-[#f5ece1]/50">{testimonialSubBadge}</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs italic text-[#f5ece1]/80 line-clamp-3 leading-relaxed">
                              &ldquo;{testimonialText}&rdquo;
                            </p>
                            <p className="text-[10px] text-accent font-semibold">{testimonialAuthor}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-accent font-semibold mt-4 block">{testimonialBtnText}</span>
                      </a>

                      {/* Highlight Card 4: YouTube channel */}
                      <a 
                        href={youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col justify-between p-4 rounded-2xl bg-[#1a100a]/70 border border-accent/15 hover:border-accent/40 hover:bg-[#1a100a] transition-all duration-300 group"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center gap-1">
                              YouTube
                            </span>
                            <span className="text-[10px] text-[#f5ece1]/50">คลิปวิดีโอ</span>
                          </div>
                          <div className="aspect-video relative rounded-lg overflow-hidden border border-accent/15">
                            <img src={heroImage} alt="YouTube Highlight" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-[#f5ece1] line-clamp-2">
                            ชมคลิปพาเที่ยวเมืองลับแลและเรื่องเล่าอาหารพื้นบ้าน
                          </p>
                        </div>
                        <span className="text-[10px] text-accent font-semibold mt-4 block">เปิดดูคลิป YouTube →</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (sectionKey === "booking") {
          return (
            <section key="booking" id="booking" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28">
              <div className="text-center space-y-3 mb-8">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-thai font-medium border border-accent/30 tracking-wide">
                  <Clock className="w-3.5 h-3.5" />
                  สำรองที่นั่งล่วงหน้า
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold font-thai text-primary leading-tight">
                  จองโต๊ะอาหารล่วงหน้า
                </h2>
                <p className="font-thai text-xs sm:text-sm text-[#f5ece1]/80 max-w-lg mx-auto leading-relaxed">
                  เลือกวันและเวลาที่ว่าง แล้วส่งคำขอจองได้จากหน้าเว็บ ทางร้านจะแจ้งผลยืนยันกลับทาง LINE
                </p>
              </div>
              <BookingForm />
            </section>
          );
        }

        if (sectionKey === "contact" && showContact) {
          return (
            <section key="contact" id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Info Column */}
                <div className="space-y-6 flex flex-col justify-center">
                  <div className="space-y-2">
                    <span className="text-accent font-bold text-sm tracking-wider uppercase font-thai">
                      ที่ตั้งและการติดต่อ
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold font-thai text-primary">
                      แวะมากินข้าวบ้านเรานะครับ
                    </h2>
                  </div>
                  <p className="font-thai text-sm sm:text-base text-[#f5ece1]/85 leading-relaxed">
                    มากินข้าวใต้ถุนเรือนไม้โบราณ 100 ปี สัมผัสรสมือของครอบครัวเราที่ปรุงสดใหม่ทุกจาน จะแวะมาเที่ยวหรือพาครอบครัวมาทานข้าว ยินดีต้อนรับทุกท่านครับ
                  </p>

                  <div className="space-y-4 font-thai text-sm text-[#f5ece1]/85 pt-2">
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 mr-3 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-primary">เวลาเปิดให้บริการ</p>
                        <p className="text-[#f5ece1]/80">{hours}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="w-5 h-5 mr-3 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-primary">โทรสอบถามหรือจองโต๊ะ</p>
                        <p className="text-[#f5ece1]/80">{phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 mr-3 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-primary">ที่ตั้งร้าน</p>
                        <p className="text-[#f5ece1]/80">{address}</p>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline inline-block mt-1 font-semibold"
                        >
                          เปิดเส้นทางใน Google Maps →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Image & Direction Overlay Column */}
                <div className="relative group rounded-3xl overflow-hidden shadow-lg aspect-video md:aspect-auto md:h-[350px] border border-primary/5">
                  <img 
                    src={aboutImage} 
                    alt="บรรยากาศร้านลำลำลับแล" 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                  {/* Elegant directions overlay */}
                  <div className="absolute inset-0 bg-black/45 flex flex-col justify-end p-6 sm:p-8 space-y-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h4 className="font-thai font-bold text-cream text-lg">ยินดีต้อนรับสู่บ้าน 100 ปี</h4>
                    <p className="font-thai text-xs text-cream/90">ตั้งอยู่ในอำเภอลับแล จังหวัดอุตรดิตถ์ มีที่จอดรถสะดวกสบาย</p>
                    <div>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent hover:bg-accent-dark text-primary-dark font-thai font-bold rounded-xl text-xs transition-all shadow-md"
                      >
                        <MapPin className="w-4 h-4" />
                        {contactBtnText}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 font-thai" aria-labelledby="visit-questions">
        <h2 id="visit-questions" className="text-2xl font-bold text-primary mb-5">ก่อนแวะมากินข้าวที่ลับแล</h2>
        <div className="divide-y divide-accent/20 rounded-2xl border border-accent/20 px-5">
          <details className="py-4">
            <summary className="cursor-pointer font-semibold text-primary">ร้านลำลำลับแลบ้าน 100 ปี อยู่ที่ไหน?</summary>
            <p className="mt-3 text-sm leading-relaxed text-primary/80">{address} <Link href="/directions" className="text-accent underline">ดูแผนที่และเส้นทางมาร้าน</Link></p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-semibold text-primary">ร้านเปิดเวลาไหน?</summary>
            <p className="mt-3 text-sm leading-relaxed text-primary/80">{hours} สอบถามเพิ่มเติมได้ที่ {phone}</p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-semibold text-primary">มีอาหารอะไรให้เลือกบ้าง?</summary>
            <p className="mt-3 text-sm leading-relaxed text-primary/80">อาหารพื้นเมืองลับแลและอาหารเหนือสูตรครอบครัว 4 รุ่น ทั้งชุดขันโตก น้ำพริก และกับข้าว พริกแกงทำเอง <Link href="/menu" className="text-accent underline">ดูเมนูและราคาปัจจุบัน</Link></p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-semibold text-primary">จองโต๊ะล่วงหน้าได้อย่างไร?</summary>
            <p className="mt-3 text-sm leading-relaxed text-primary/80"><a href="#booking" className="text-accent underline">เลือกวัน เวลา และจำนวนคนในแบบฟอร์มจอง</a> แล้วรอทางร้านยืนยัน หรือโทร {phone} เพื่อสอบถามครับ</p>
          </details>
        </div>
      </section>
    </div>
  );
}
