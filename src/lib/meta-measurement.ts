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
