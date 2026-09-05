import React from "react";
import { getSetting } from "@/lib/data";
import AboutClientView from "@/components/AboutClientView";
import { DEFAULT_ABOUT_DATA, AboutCustomData } from "@/components/AboutPageEditor";

export const revalidate = 0; // Disable static cache so admin edits reflect immediately

export const metadata = {
  title: "รู้จักบ้านและเรื่องเล่าลับแล | ร้านลำลำลับแลบ้าน 100 ปี",
  description: "เรื่องราวของเรือนไม้ไร้ตะปู 100 ปี คนสี่รุ่น และอาหารแห่งความทรงจำ ณ ลำลำลับแล จ.อุตรดิตถ์",
};

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
