import React from "react";
import Link from "next/link";
import { getSetting } from "@/lib/data";
import { MapPin, Phone, Clock, Video, Lock, Star } from "lucide-react";

export default async function Footer() {
  // Fetch settings dynamically from database
  const facebookUrl = await getSetting("facebook_url") || "https://www.facebook.com/lumlumlablae/";
  const tiktokUrl = await getSetting("tiktok_url") || "https://www.tiktok.com/@lumlumlablae1";
  const youtubeUrl = await getSetting("youtube_url") || "https://www.youtube.com/@ร้านอาหารเมืองลับแล";
  const googleMapsUrl = await getSetting("google_maps_url") || "https://maps.app.goo.gl/8xsKvMFqaAMfE3K87";
  const googleReviewsUrl = await getSetting("google_reviews_url") || "https://maps.app.goo.gl/HQpRWVM8qFobGHxL6?g_st=ic";
  const phone = await getSetting("phone") || "095-628-3125";
  const hours = await getSetting("hours") || "เปิดทุกวัน 10.00 น. - 20.00 น.";
  const address = await getSetting("address") || "ถนนสายของกินเมืองลับแล, ต.ศรีพนมมาศ, อ.ลับแล, จ.อุตรดิตถ์";

  return (
    <footer className="bg-primary-dark text-cream pt-16 pb-8 border-t-4 border-accent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Column 1: Info & Name */}
          <div className="space-y-4">
            <h3 className="font-thai font-bold text-xl text-accent tracking-wide">
              ร้านลำลำลับแลบ้าน 100 ปี
            </h3>
            <p className="font-thai text-sm text-cream/70 leading-relaxed">
              อาหารที่บ้านเราคือการผสมผสานวัฒนธรรม สุโขทัยและล้านนา
              มรดกตกทอดจากสูตรของทวดกว่า 100 ปี ณ เมืองลับแล จังหวัดอุตรดิตถ์
            </p>
            
            {/* Social Icons Container */}
            <div className="space-y-2">
              <p className="font-thai text-xs font-semibold text-accent/80">ช่องทางการติดต่อ & รีวิว</p>
              <div className="flex flex-wrap gap-3.5">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-accent hover:text-primary-dark transition-colors duration-200"
                  aria-label="Facebook"
                  title="เพจเฟซบุ๊ก"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-accent hover:text-primary-dark transition-colors duration-200"
                  aria-label="TikTok"
                  title="ติ๊กต็อก"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.63 4.14 1.13 1.2 2.68 1.9 4.31 2.01v3.9c-1.85-.02-3.61-.75-4.96-2.02-.13-.13-.26-.27-.38-.41v6.98c.01 4.14-2.88 7.82-6.94 8.79-4.73 1.23-9.56-1.57-10.74-6.3-1.18-4.73 1.59-9.56 6.32-10.74 1.5-.38 3.08-.29 4.52.27v4.19c-1.13-.7-2.58-.75-3.76-.13-1.46.77-2.14 2.53-1.54 4.1.6 1.56 2.33 2.35 3.92 1.83 1.45-.48 2.39-1.88 2.39-3.41V.02Z"/>
                  </svg>
                </a>
                <a
                  href={googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-accent hover:text-primary-dark transition-colors duration-200 flex items-center gap-1"
                  aria-label="Google Reviews"
                  title="รีวิวร้านบน Google"
                >
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </a>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-accent hover:text-primary-dark transition-colors duration-200"
                  aria-label="YouTube"
                  title="ยูทูบ"
                >
                  <Video className="w-5 h-5" />
                </a>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-accent hover:text-primary-dark transition-colors duration-200"
                  aria-label="Google Maps"
                  title="แผนที่นำทาง"
                >
                  <MapPin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="font-thai font-semibold text-lg text-accent tracking-wide">
              ลิงก์แนะนำ
            </h4>
            <ul className="space-y-2 font-thai text-sm text-cream/70">
              <li>
                <Link href="/" className="hover:text-accent transition-colors">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-accent transition-colors">
                  รู้จักเรา & ตำนานลับแล
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-accent transition-colors">
                  เมนูแนะนำ
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-accent transition-colors">
                  บทความ/เรื่องราวจากครัวไฟ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Hours */}
          <div className="space-y-4">
            <h4 className="font-thai font-semibold text-lg text-accent tracking-wide">
              ข้อมูลการติดต่อ
            </h4>
            <div className="space-y-3 font-thai text-sm text-cream/70">
              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-3 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-cream">เวลาเปิดให้บริการ</p>
                  <p>{hours}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="w-5 h-5 mr-3 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-cream">เบอร์โทรศัพท์ติดต่อร้าน</p>
                  <p>{phone}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-cream">ที่ตั้งร้าน</p>
                  <p>{address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-xs text-cream/50 font-thai">
          <p>© {new Date().getFullYear()} ร้านลำลำลับแลบ้าน 100 ปี. สงวนลิขสิทธิ์.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              href="/admin/login"
              className="inline-flex items-center hover:text-accent transition-colors"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              แดชบอร์ดหลังบ้าน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
