'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { isPublicAnalyticsPath } from '@/lib/website-analytics';
import { META_ACTION_EVENT, META_BOOKING_EVENT, META_CONSENT_COOKIE, META_CONSENT_EVENT, metaActionName, metaUrlParametersAreSafe, emitBookingLead } from '@/lib/meta-measurement';

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...args: unknown[]) => void; push?: Fbq; loaded?: boolean; version?: string };
type MetaWindow = Window & { fbq?: Fbq; _fbq?: Fbq; lablaeMetaId?: string };
const subscribe = (listener: () => void) => { window.addEventListener(META_CONSENT_EVENT, listener); return () => window.removeEventListener(META_CONSENT_EVENT, listener); };
const snapshot = () => document.cookie.split('; ').find(part => part.startsWith(`${META_CONSENT_COOKIE}=`))?.split('=')[1] || 'unset';
const serverSnapshot = () => 'server';

export default function MetaMeasurement({ pixelId }: { pixelId: string }) {
  const path = usePathname();
  const consent = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const lastPage = useRef('');
  const sentBookings = useRef(new Set<string>());
  const publicPage = isPublicAnalyticsPath(path);

  function choose(value: 'yes' | 'no') {
    document.cookie = `${META_CONSENT_COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax; Secure`;
    window.dispatchEvent(new Event(META_CONSENT_EVENT));
    // Unload the third-party script on withdrawal as well as revoking its consent.
    if (value === 'no' && (window as MetaWindow).fbq) {
      (window as MetaWindow).fbq!('consent', 'revoke');
      window.location.reload();
    }
  }

  useEffect(() => {
    const w = window as MetaWindow;
    const host = ['www.lablae.net', 'lablae.net'].includes(location.hostname);
    if (!pixelId || !host || consent !== 'yes' || !publicPage) {
      w.fbq?.('consent', 'revoke');
      lastPage.current = '';
      return;
    }
    // Only approved campaign parameters and public anchors may reach Meta.
    if (!metaUrlParametersAreSafe(new URL(location.href))) {
      w.fbq?.('consent', 'revoke');
      return;
    }
    if (document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (!metaUrlParametersAreSafe(ref) || (ref.origin === location.origin && !isPublicAnalyticsPath(ref.pathname))) {
          w.fbq?.('consent', 'revoke');
          return;
        }
      } catch { w.fbq?.('consent', 'revoke'); return; }
    }
    if (!w.fbq) {
      const fbq: Fbq = (...args) => { if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue!.push(args); };
      fbq.queue = []; fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0';
      w.fbq = fbq; w._fbq = fbq;
    }
    w.fbq('consent', 'grant');
    if (w.lablaeMetaId !== pixelId) {
      w.fbq('set', 'autoConfig', false, pixelId);
      w.fbq('init', pixelId);
      w.lablaeMetaId = pixelId;
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'; script.async = true;
      script.id = 'lablae-meta-pixel'; document.head.appendChild(script);
    }
    if (lastPage.current !== path) {
      w.fbq('trackSingle', pixelId, 'PageView');
      lastPage.current = path;
    }
    const action = (event: Event) => {
      if (snapshot() !== 'yes' || !isPublicAnalyticsPath(location.pathname) || !metaUrlParametersAreSafe(new URL(location.href))) return;
      const name = metaActionName((event as CustomEvent<string>).detail);
      if (name) w.fbq?.('trackSingleCustom', pixelId, name);
    };
    const booking = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (snapshot() === 'yes' && isPublicAnalyticsPath(location.pathname) && metaUrlParametersAreSafe(new URL(location.href))) {
        if (w.fbq) emitBookingLead(w.fbq, pixelId, id, sentBookings.current);
      }
    };
    window.addEventListener(META_ACTION_EVENT, action);
    window.addEventListener(META_BOOKING_EVENT, booking);
    return () => {
      window.removeEventListener(META_ACTION_EVENT, action);
      window.removeEventListener(META_BOOKING_EVENT, booking);
      w.fbq?.('consent', 'revoke');
    };
  }, [pixelId, consent, path, publicPage]);

  if (!pixelId || !publicPage || consent === 'server') return null;
  if (consent !== 'unset') return <button type="button" onClick={() => choose(consent === 'yes' ? 'no' : 'yes')} className="fixed bottom-20 left-3 z-40 rounded bg-stone-900 px-3 py-2 text-xs text-white">{consent === 'yes' ? 'ปิดการวัดผลโฆษณา' : 'อนุญาตการวัดผลโฆษณา'}</button>;
  return <section aria-label="การวัดผลโฆษณา" className="fixed bottom-20 left-3 right-3 z-50 mx-auto max-w-xl rounded-xl border border-stone-600 bg-stone-950 p-4 text-sm text-white shadow-xl">
    <p>อนุญาตให้ส่งข้อมูลการดูหน้าเว็บ การกดปุ่ม และการส่งคำขอจองให้ Meta เพื่อวัดผลและปรับโฆษณาบน Facebook/Instagram ไหมครับ? Meta อาจใช้คุกกี้และข้อมูลเบราว์เซอร์เพื่อจับคู่กิจกรรมกับบัญชีของคุณ เราไม่ส่งชื่อ เบอร์โทร หรือข้อความที่กรอกในแบบฟอร์ม คุณเปลี่ยนใจได้ทุกเมื่อ และใช้เว็บหรือจองโต๊ะได้ตามปกติหากไม่อนุญาต</p>
    <p className="mt-2"><a className="underline" href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noreferrer">นโยบายความเป็นส่วนตัวของ Meta</a></p>
    <div className="mt-3 flex gap-3"><button type="button" className="rounded border px-4 py-2" onClick={() => choose('no')}>ไม่อนุญาต</button><button type="button" className="rounded border px-4 py-2" onClick={() => choose('yes')}>อนุญาต</button></div>
  </section>;
}
