import React from "react";
import { pageMetadata } from "@/lib/seo";
import { getSetting } from "@/lib/data";
import AboutClientView from "@/components/AboutClientView";
import { DEFAULT_ABOUT_DATA, AboutCustomData } from "@/components/AboutPageEditor";

export const revalidate = 0; // Disable static cache so admin edits reflect immediately

export const metadata = pageMetadata(
  "บ้านไม้ 100 ปีและเรื่องราวอาหารเมืองลับแล",
  "รู้จักร้านลำลำลับแลบ้าน 100 ปี อำเภอลับแล จังหวัดอุตรดิตถ์ เรื่องราวบ้านไม้โบราณ ครอบครัว 4 รุ่น และอาหารพื้นเมืองที่ส่งต่อกันในครอบครัว",
  "/about",
);

export default async function AboutPage() {
  const rawAboutData = await getSetting("about_page_custom_data");
  let aboutData: AboutCustomData = DEFAULT_ABOUT_DATA;

  try {
    if (rawAboutData) {
      const parsed = JSON.parse(rawAboutData);
      aboutData = { ...DEFAULT_ABOUT_DATA, ...parsed };
    }
  } catch {
    aboutData = DEFAULT_ABOUT_DATA;
  }

  const hours = (await getSetting("hours")) || "เปิดทุกวัน 10.00 น. - 20.00 น.";
  const phone = (await getSetting("phone")) || "095-628-3125";
  const address = (await getSetting("address")) || "ถนนสายของกินเมืองลับแล, ต.ศรีพนมมาศ, อ.ลับแล, จ.อุตรดิตถ์";
  const googleMapsUrl = (await getSetting("google_maps_url")) || "https://maps.app.goo.gl/8xsKvMFqaAMfE3K87";

  return (
    <AboutClientView
      data={aboutData}
      hours={hours}
      phone={phone}
      address={address}
      googleMapsUrl={googleMapsUrl}
    />
  );
}
