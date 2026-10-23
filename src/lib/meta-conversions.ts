import { createHash } from 'node:crypto';
import { validMetaPixelId } from './meta-measurement';

export function bookingMetaEventId(reservationId: number): string {
  return createHash('sha256').update(`lablae:booking-request:${reservationId}`).digest('hex');
}

// One bounded attempt after a successful new booking. Never retry or block a booking.
// No names, phone numbers, booking codes, notes, IP addresses or raw URLs are sent.
export async function sendMetaBooking(input: { id: number; consent: boolean; fbp?: string; userAgent?: string }): Promise<boolean> {
  const pixel = validMetaPixelId(process.env.META_PIXEL_ID);
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION;
  if (process.env.META_MEASUREMENT_ENABLED !== '1' || process.env.META_CAPI_ENABLED !== '1' || !pixel || !token || !version || !/^v\d+\.0$/.test(version) || !input.consent) return false;
  if (!input.fbp || !/^fb\.\d\.\d{10,16}\.\d{1,30}$/.test(input.fbp)) return false;
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${pixel}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: [{
        event_name: 'Lead', event_id: bookingMetaEventId(input.id), event_time: Math.floor(Date.now() / 1000),
        action_source: 'website', event_source_url: 'https://www.lablae.net/',
        user_data: { fbp: input.fbp, client_user_agent: (input.userAgent || '').slice(0, 512) },
        custom_data: { content_name: 'booking_request' },
      }], ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}) }),
      signal: AbortSignal.timeout(2000), redirect: 'error',
    });
    if (!response.ok) { console.warn('Meta booking measurement failed', response.status); return false; }
    const result = await response.json() as { events_received?: number };
    return result.events_received === 1;
  } catch { console.warn('Meta booking measurement unavailable'); return false; }
}
