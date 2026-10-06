'use client';
import { useState } from 'react';
import Link from 'next/link';
import data from './places.json';
import histories from './histories.json';

type PlaceHistory = { paragraphs: string[]; legend?: string; sources: { label: string; url: string }[] };
const historyByNumber: Record<string, PlaceHistory> = histories;

const zones = ['ทั้งหมด', 'ทุ่งยั้ง', 'ประตูเมือง', 'ดอนสัก–ฝายหลวง–แม่พูล'];
// Keep the existing data keys while matching the owner's map headings.
const zoneLabels: Record<string, string> = {
  'ทั้งหมด': 'ทั้งหมด',
  'ทุ่งยั้ง': 'ทุ่งยั้ง • สุโขทัย',
  'ประตูเมือง': 'ย่านประตูเมือง',
  'ดอนสัก–ฝายหลวง–แม่พูล': 'ฝายหลวง–แม่พูล • ล้านนา',
};
export default function Guide() {
  const [zone, setZone] = useState('ทั้งหมด');
  const [query, setQuery] = useState('');
  const places = data.places.filter(p => (zone === 'ทั้งหมด' || p.zone === zone) && `${p.name} ${p.category} ${p.description}`.includes(query.trim()));
  function reveal() { setZone('ทั้งหมด'); setQuery(''); }
  return <div className="laplae-guide">
    <div className="travel-hero"><header className="travel-intro">
      <p className="travel-kicker">ลำลำลับแล บ้าน 100 ปี ชวนเที่ยวบ้านเรา</p>
      <h1>เที่ยวลับแล<span>ค่อย ๆ แวะไปทีละย่าน</span></h1>
      <p>ไหว้พระ เดินตลาด ชมบ้านเก่า แล้วแวะกินข้าวที่บ้านเรา<br className="travel-desktop" /> เลือกย่านที่สนใจ แล้วแวะในแบบของคุณได้เลยครับ</p>
      <nav aria-label="ส่วนต่าง ๆ ในคู่มือ" className="travel-actions"><a href="#illustration">ดูภาพรวม</a><a href="#places">เลือกที่เที่ยว</a><a href="#real-map">แผนที่หมุดจริง</a></nav>
    </header>
    <section id="illustration" aria-label="ภาพแนะนำสถานที่" className="travel-section">
      <div className="travel-heading"><h2>ลับแลมีอะไรให้แวะบ้าง</h2><a href="/travel/laplae-map-v65.webp" target="_blank" rel="noreferrer">เปิดภาพใหญ่ ↗</a></div>
      <div className="travel-poster">
        <img src="/travel/laplae-map-v65.webp" width="3600" height="1800" alt="ภาพแนะนำที่เที่ยวลับแล แบ่งโซนทุ่งยั้ง • สุโขทัย ย่านประตูเมือง และฝายหลวง–แม่พูล • ล้านนา" fetchPriority="high" />
        {data.places.map(p => <a key={p.id} href={`#${p.id}`} onClick={reveal} aria-label={`ดูรายละเอียด ${p.name}`} title={p.name} className="travel-hotspot" style={{ left: `${p.hotspot[0]}%`, top: `${p.hotspot[1]}%` }} />)}
      </div>
      <p className="travel-note">แตะหมายเลขในภาพเพื่ออ่านต่อ ภาพนี้ใช้แนะนำสถานที่ ไม่ได้แสดงระยะทางจริง บนมือถือเลือกจากรายชื่อด้านล่างจะอ่านง่ายกว่าครับ</p>
    </section>
    </div>
    <section id="places" className="travel-section">
      <div className="travel-heading"><div><p className="travel-kicker">วัด ตลาด บ้านเก่า และธรรมชาติ</p><h2>เลือกที่เที่ยวตามย่าน</h2></div><span>19 จุดน่าแวะ</span></div>
      <div className="travel-filters" aria-label="กรองตามย่าน">{zones.map(z => <button key={z} onClick={() => setZone(z)} aria-pressed={zone === z}>{zoneLabels[z]}</button>)}</div>
      <label className="travel-search">ค้นหาสถานที่<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="เช่น วัดดอนสัก หรือ ตลาด" /></label>
      <p className="travel-note" role="status">พบ {places.length} สถานที่ · ข้อมูลสถานที่ตรวจจากแหล่งเผยแพร่วันที่ 20 กันยายน 2569 เวลาเปิดอาจเปลี่ยนได้</p>
      {!places.length && <div className="travel-empty"><p>ยังไม่พบชื่อนี้ ลองค้นคำสั้น ๆ หรือเลือกทุกย่านครับ</p><button onClick={reveal}>ดูทั้งหมด</button></div>}
      {zones.slice(1).filter(z => places.some(p => p.zone === z)).map((z) => <section className="travel-zone" key={z} aria-label={zoneLabels[z]}><header className="travel-zone-heading"><h3>{zoneLabels[z]}</h3><p>{z === "ทุ่งยั้ง" ? "พระบรมธาตุ วัดเก่า และร่องรอยเมืองทุ่งยั้ง" : z === "ประตูเมือง" ? "ซุ้มประตู พิพิธภัณฑ์ ตลาด และบ้านเรา" : "บานประตูแกะสลัก ผ้าทอ จุดชมเมือง และธรรมชาติ"}</p></header><div className="travel-cards">{places.filter(p => p.zone === z).map(p => <article key={p.id} id={p.id} className={`travel-card ${p.photo ? "has-photo" : "text-only"}`}>
        {p.photo && <div className={`travel-photo ${p.id === "LPL-013" ? "travel-photo-rotate" : ""}`}><img src={p.photo} alt={p.name} loading="lazy" width="1000" height="750" /></div>}
        <div className="travel-card-body"><p className="travel-kicker">{p.category}</p><h4><span className="travel-number">{p.poster_number}</span>{p.name}</h4><p>{p.description}</p>
        {historyByNumber[p.poster_number] && (
          <details className="travel-history" aria-label={`ประวัติ ${p.name}`}>
            <summary>ประวัติและเรื่องของที่นี่</summary>
            {historyByNumber[p.poster_number].paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            {historyByNumber[p.poster_number].legend && (
              <p className="travel-legend"><strong>ตำนานท้องถิ่น</strong> {historyByNumber[p.poster_number].legend}</p>
            )}
            <details className="travel-history-sources">
              <summary>ที่มาของประวัติ</summary>
              <ul>{historyByNumber[p.poster_number].sources.map(source => (
                <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>
              ))}</ul>
            </details>
          </details>
        )}
        <details><summary>เวลาเปิด ที่จอด และข้อมูลก่อนแวะ</summary><dl><dt>เวลาเปิด</dt><dd>{p.hours_display}</dd><dt>ที่จอดรถ</dt><dd>{p.parking?.text || 'ยังไม่มีข้อมูลที่ยืนยันได้'}</dd></dl><p className="travel-note">{p.navigation_note}</p><p className="travel-sources">แหล่งข้อมูล: {p.source_urls.filter(url => /^https:\/\//.test(url) && !url.includes('drive.google.com')).slice(0, 3).map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer">แหล่งที่ {i + 1}</a>)}</p></details>
        {p.navigation_url ? <a className="travel-map-link" href={p.navigation_url} target="_blank" rel="noreferrer">เปิดสถานที่ใน Google Maps ↗</a> : <p className="travel-note">ฝายหลวง: ยังรอยืนยันหมุดตัวฝาย จึงยังไม่มีปุ่มนำทาง</p>}
        </div>
      </article>)}</div></section>)}
    </section>
    <section id="real-map" className="travel-section"><h2>ดูตำแหน่งบนแผนที่จริง</h2><p>18 หมุดอ้างอิงสถานที่ กดหมุดเพื่อเปิดรายละเอียด ส่วนฝายหลวงยังรอยืนยันตำแหน่งตัวฝาย หมุดส่วนใหญ่ไม่ได้ระบุทางเข้าหรือช่องจอดรถครับ</p><iframe title="แผนที่สถานที่เที่ยวลับแลบน OpenStreetMap" src="/travel/map.html" loading="lazy" className="travel-live-map" /><p className="travel-note">หากแผนที่ไม่ขึ้น ใช้ปุ่ม Google Maps ในแต่ละสถานที่ด้านบนได้ครับ</p></section>
    <aside className="travel-house"><p className="travel-kicker">เที่ยวแล้ว แวะกินข้าวที่บ้านเรา</p><h2>ลำลำลับแล บ้าน 100 ปี</h2><p>กับข้าวบ้านเรา ใต้ถุนบ้านไม้ร้อยปี<br />เปิดทุกวัน 10.00–20.00 น. จอดรถที่ร้านได้ครับ</p><div className="travel-actions"><Link href="/menu">ดูเมนูอาหาร</Link><a href="tel:0956283125">โทร 095-628-3125</a><a href={data.places.find(p => p.id === 'LPL-008')!.navigation_url!} target="_blank" rel="noreferrer">นำทางมาร้าน ↗</a></div></aside>
  </div>;
}
