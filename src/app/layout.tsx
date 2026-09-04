import type { Metadata, Viewport } from "next";
import { Inter, Sarabun } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileQuickBar from "@/components/MobileQuickBar";
import { getSetting } from "@/lib/data";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lablae.net"),
  title: {
    default: "ร้านลำลำลับแลบ้าน 100 ปี | อาหารเมืองลับแล อุตรดิตถ์",
    template: "%s | ร้านลำลำลับแลบ้าน 100 ปี",
  },
  description: "อาหารเหนือแบบลับแลโบราณ ส่งต่อมาสี่รุ่น รสชาติเข้มข้นผสมผสานวัฒนธรรมล้านนาและสุโขทัย ร้านอาหารเมืองลับแล ขันโตก ข้าวพันผัก ใต้ถุนเรือนไม้ไร้ตะปู 100 ปี จ.อุตรดิตถ์",
  keywords: [
    "ร้านอาหารลับแล",
    "ร้านอาหารอุตรดิตถ์",
    "ลำลำลับแล",
    "ลำลำลับแลบ้าน 100 ปี",
    "ของกินลับแล",
    "อาหารเมืองลับแล",
    "ขันโตก ลับแล",
    "ข้าวพันผัก ลับแล",
    "ร้านอร่อยลับแล",
    "ที่กินลับแล",
    "เที่ยวลับแล",
    "อาหารเหนือ อุตรดิตถ์",
    "หมูทอดลับแลพริกข่า"
  ],
  authors: [{ name: "ร้านลำลำลับแลบ้าน 100 ปี" }],
  creator: "ร้านลำลำลับแลบ้าน 100 ปี",
  publisher: "ร้านลำลำลับแลบ้าน 100 ปี",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://www.lablae.net",
    siteName: "ร้านลำลำลับแลบ้าน 100 ปี",
    title: "ร้านลำลำลับแลบ้าน 100 ปี | อาหารเมืองลับแล อุตรดิตถ์",
    description: "อาหารเหนือแบบลับแลโบราณ ส่งต่อมาสี่รุ่น รสชาติเข้มข้นผสมผสานวัฒนธรรมล้านนาและสุโขทัย ใต้ถุนเรือนไม้ไร้ตะปู 100 ปี",
    images: [
      {
        url: "/images/menu/khantoke_big.jpg",
        width: 1200,
        height: 630,
        alt: "ชุดขันโตก ร้านลำลำลับแลบ้าน 100 ปี",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ร้านลำลำลับแลบ้าน 100 ปี | อาหารเมืองลับแล อุตรดิตถ์",
    description: "อาหารเหนือแบบลับแลโบราณ ส่งต่อมาสี่รุ่น ณ เมืองลับแล จ.อุตรดิตถ์",
    images: ["/images/menu/khantoke_big.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Helper function to dynamically adjust brightness for shades
function adjustBrightness(hex: string, percent: number): string {
  try {
    hex = hex.replace(/^\s*#|\s*$/g, "");
    if (hex.length === 3) {
      hex = hex.replace(/(.)/g, "$1$1");
    }
    let r = parseInt(hex.substring(0, 2), 16),
        g = parseInt(hex.substring(2, 4), 16),
        b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, Math.max(0, r + (r * percent) / 100));
    g = Math.min(255, Math.max(0, g + (g * percent) / 100));
    b = Math.min(255, Math.max(0, b + (b * percent) / 100));

    const rHex = Math.round(r).toString(16).padStart(2, "0");
    const gHex = Math.round(g).toString(16).padStart(2, "0");
    const bHex = Math.round(b).toString(16).padStart(2, "0");

    return `#${rHex}${gHex}${bHex}`;
  } catch {
    return hex;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch Theme Customizations from SQLite
  const primaryColor = (await getSetting("theme_primary_color")) || "#f7eee3";
  const accentColor = (await getSetting("theme_accent")) || "#d4a373";
  const warmBg = (await getSetting("theme_warm_bg")) || "#1a100a";
  const creamColor = (await getSetting("theme_cream")) || "#f7eee3";

  // Fetch Business Data for AI Search optimization (JSON-LD Schema)
  const restaurantName = (await getSetting("restaurant_name")) || "ร้านลำลำลับแลบ้าน 100 ปี";
  const phone = (await getSetting("phone")) || "095-628-3125";
  const address = (await getSetting("address")) || "ถนนสายของกินเมืองลับแล, ต.ศรีพนมมาศ, อ.ลับแล, จ.อุตรดิตถ์";
  const facebookUrl = (await getSetting("facebook_url")) || "https://www.facebook.com/lumlumlablae/";
  const tiktokUrl = (await getSetting("tiktok_url")) || "https://www.tiktok.com/@lumlumlablae1";
  const youtubeUrl = (await getSetting("youtube_url")) || "https://www.youtube.com/@ร้านอาหารเมืองลับแล";
  const googleMapsUrl = (await getSetting("google_maps_url")) || "https://maps.app.goo.gl/8xsKvMFqaAMfE3K87";
  const heroImage = (await getSetting("home_hero_image")) || "";
  const aboutImage = (await getSetting("home_about_image")) || "";
  const brandLogo = (await getSetting("brand_logo")) || "";
  const navbarBtnText = (await getSetting("navbar_btn_text")) || "ดูเมนูอาหาร";
  const navbarBtnLink = (await getSetting("navbar_btn_link")) || "/menu";

  // Derive light/dark shades dynamically
  const primaryDark = adjustBrightness(primaryColor, -35);
  const primaryLight = adjustBrightness(primaryColor, 35);
  const accentDark = adjustBrightness(accentColor, -15);

  // Schema.org Restaurant JSON-LD object
  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": restaurantName,
    "image": [
      heroImage || "https://lh3.googleusercontent.com/sitesv/AA5AbUBtBaZCAX-9g_MZWwNQqvEX6s88oX2eQ8flnpJYsoyFpI7B3ZTMEW3UBdmpNW6VQNI88JEjwbdriszJXS-2j-NhH0Zl5rSbZyXB4F-3sz5S6Ib3EYTV2fZGGKFpMU1x0QdtSqabAmjzbpljKB1IneR9V9gGou-HuVQy9GTJlOti6Yt0Jb1g1U9QCwo=w16383",
      aboutImage || "https://lh3.googleusercontent.com/sitesv/AA5AbVd9WREClQayfZ7COMLiB91ilUHfEaJefV-DkYOhJLfhpHlbdpnWtZ-s4YnEidqkx8kEnBAQldI3t5Tokl-EMA6k6iY9pNIXI5_-QNGPMUbxcrtWZYB439lqAW0Qt-Hh2Xly7sB2KP7vlppjntbXUXmYriHo_ir0XvRKtNC9UAZtwLkkc4nEflbQ7MdVyCIuxdM213VLqZr1KPB"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": address,
      "addressLocality": "ลับแล",
      "addressRegion": "อุตรดิตถ์",
      "postalCode": "53130",
      "addressCountry": "TH"
    },
    "telephone": phone,
    "priceRange": "฿50 - ฿350",
    "servesCuisine": ["อาหารเหนือ", "อาหารพื้นเมืองลับแล", "อาหารล้านนา", "อาหารสุโขทัย", "ข้าวพันผัก"],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "10:00",
        "closes": "20:00"
      }
    ],
    "sameAs": [
      facebookUrl,
      tiktokUrl,
      youtubeUrl,
      googleMapsUrl
    ]
  };

  return (
    <html
      lang="th"
      className={`${inter.variable} ${sarabun.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root {
              --color-primary: ${primaryColor} !important;
              --color-primary-dark: #120904 !important;
              --color-primary-light: #fff6ed !important;
              --color-accent: ${accentColor} !important;
              --color-accent-dark: #dfa86c !important;
              --color-warm-bg: ${warmBg} !important;
              --color-cream: ${creamColor} !important;
              --background: ${warmBg} !important;
              --foreground: #f5ece1 !important;
            }
          `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-warm-bg text-[#f5ece1] overflow-x-hidden">
        <Navbar logoUrl={brandLogo} btnText={navbarBtnText} btnLink={navbarBtnLink} />
        <main className="flex-grow pt-24 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileQuickBar phone={phone} googleMapsUrl={googleMapsUrl} />
      </body>
    </html>
  );
}
