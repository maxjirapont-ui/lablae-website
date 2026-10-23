// Shared constants only; never put an access token in a client module.
export const META_CONSENT_COOKIE = 'lablae_meta_consent';
export const META_CONSENT_EVENT = 'lablae:meta-consent';
export const META_ACTION_EVENT = 'lablae:website-action';
export const META_BOOKING_EVENT = 'lablae:booking-request';

export function validMetaPixelId(value: string | undefined): string {
  return value && /^\d{10,20}$/.test(value) ? value : '';
}

export function metaActionName(action: string): string | null {
  const names: Record<string, string> = {
    menu_click: 'MenuClick', directions_click: 'DirectionsClick',
    phone_click: 'PhoneClick', messenger_click: 'MessengerClick', booking_click: 'BookingClick',
  };
  return names[action] || null;
}

// Pixel sees its document URL. Permit only public campaign labels and click IDs,
// never arbitrary query values (names, phone numbers, booking tokens, searches).
export function metaUrlParametersAreSafe(url: URL): boolean {
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return false;
  if (!['', '#booking', '#menu'].includes(url.hash)) return false;
  const labels: Record<string, readonly string[]> = {
    utm_source: ['facebook', 'instagram', 'meta', 'google', 'tiktok', 'line'],
    utm_medium: ['paid_social', 'cpc', 'social', 'organic_social', 'organic', 'referral'],
    utm_campaign: ['website_launch', 'business_profile', 'restaurant_visit', 'booking_test'],
    utm_content: ['menu', 'booking', 'directions', 'house_story', 'sai_ua', 'website', 'pinned_menu'],
  };
  const seen = new Set<string>();
  for (const [key, value] of url.searchParams) {
    if (seen.has(key)) return false;
    seen.add(key);
    if (key === 'fbclid') {
      if (!/^[A-Za-z0-9_-]{10,500}$/.test(value)) return false;
    } else if (['utm_id', 'utm_term'].includes(key)) {
      if (!/^\d{5,30}$/.test(value)) return false;
    } else if (!labels[key]?.includes(value) &&
      !(['utm_campaign', 'utm_content'].includes(key) && /^\d{5,30}$/.test(value))) return false;
  }
  return true;
}

export function emitBookingLead(
  send: (...args: unknown[]) => void,
  pixelId: string,
  eventId: unknown,
  seen: Set<string>,
): boolean {
  if (typeof eventId !== 'string' || !/^[a-f0-9]{64}$/.test(eventId) || seen.has(eventId)) return false;
  send('trackSingle', pixelId, 'Lead', { content_name: 'booking_request' }, { eventID: eventId });
  seen.add(eventId);
  return true;
}
