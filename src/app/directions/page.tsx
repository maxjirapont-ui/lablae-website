import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { getSetting } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 0;

export const metadata = pageMetadata(
  "แผนที่และเส้นทางมาร้านที่ลับแล อุตรดิตถ์",
  "แผนที่ร้านลำลำลับแลบ้าน 100 ปี อำเภอลับแล จังหวัดอุตรดิตถ์ ดูที่อยู่ เวลาเปิด เบอร์โทร และเปิดเส้นทางนำทางใน Google Maps",
  "/directions",
);

const MAP_EMBED_URL =
  "https://www.google.com/maps?q=17.6586925,100.0409076&z=17&output=embed";

export default async function DirectionsPage() {
  const restaurantName =
    (await getSetting("restaurant_name")) || "ร้านลำลำลับแลบ้าน 100 ปี";
  const address =
    (await getSetting("address")) ||
    "ถนนสายของกินเมืองลับแล ต.ศรีพนมมาศ อ.ลับแล จ.อุตรดิตถ์";
  const hours =
    (await getSetting("hours")) || "เปิดทุกวัน 10.00 - 20.00 น.";
  const phone = (await getSetting("phone")) || "095-628-3125";
  const googleMapsUrl =
    (await getSetting("google_maps_url")) ||
    "https://maps.app.goo.gl/PcogZoYFxaPPAV2J8?g_st=ic";
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-accent/25 bg-[#241710] shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-2xl bg-accent/20 p-3 text-accent">
              <Navigation className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 font-thai text-xs font-bold tracking-wide text-accent">
                เดินทางมาหาเรา
              </p>
              <h1 className="font-thai text-2xl font-bold text-primary sm:text-4xl">
                แผนที่มาร้าน
              </h1>
              <p className="mt-2 font-thai text-sm text-primary/70">
                {restaurantName} อำเภอลับแล จังหวัดอุตรดิตถ์
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-accent/20 bg-[#1a100a]">
            <iframe
              title={`แผนที่ ${restaurantName}`}
              src={MAP_EMBED_URL}
              className="h-[58vh] min-h-[420px] w-full"
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-4 font-thai text-sm font-bold text-[#1a100a] transition hover:brightness-110 sm:text-base"
          >
            <Navigation className="h-5 w-5" />
            เปิด Google Maps เพื่อนำทาง
          </a>
        </div>

        <div className="grid gap-px border-t border-accent/20 bg-accent/20 md:grid-cols-3">
          <div className="flex gap-3 bg-[#1f140e] p-5 sm:p-6">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <h2 className="font-thai text-sm font-bold text-primary">ที่อยู่ร้าน</h2>
              <p className="mt-1 font-thai text-xs leading-relaxed text-primary/75">{address}</p>
            </div>
          </div>

          <div className="flex gap-3 bg-[#1f140e] p-5 sm:p-6">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <h2 className="font-thai text-sm font-bold text-primary">เวลาเปิดร้าน</h2>
              <p className="mt-1 font-thai text-xs text-primary/75">{hours}</p>
            </div>
          </div>

          <a
            href={phoneHref}
            className="flex gap-3 bg-[#1f140e] p-5 transition hover:bg-[#2b1b12] sm:p-6"
          >
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <h2 className="font-thai text-sm font-bold text-primary">โทรสอบถามเส้นทาง</h2>
              <p className="mt-1 font-thai text-xs text-primary/75">{phone}</p>
            </div>
          </a>
        </div>
      </section>
    </main>
  );
}
