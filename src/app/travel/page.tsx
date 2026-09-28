import { pageMetadata, serializeJsonLd } from '@/lib/seo';
import Guide from './Guide';
import data from './places.json';
import './travel.css';

export const metadata = pageMetadata('เที่ยวลับแล แผนที่และที่เที่ยว 3 ย่าน', 'เลือกเที่ยวลับแลตามย่าน ดูสถานที่ 19 จุด เลือกแวะตามย่านที่สนใจ แผนที่และลิงก์ Google Maps จากลำลำลับแล บ้าน 100 ปี', '/travel', '/travel/laplae-map.webp', 'ภาพแนะนำที่เที่ยวลับแล แบ่งตามย่าน');

export default function TravelPage() {
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'เที่ยวลับแล', url: 'https://www.lablae.net/travel', mainEntity: { '@type': 'ItemList', itemListElement: data.places.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: `https://www.lablae.net/travel#${p.id}` })) } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} /><Guide /></>;
}
