# Meta website measurement — prepared 23 October 2026

Dataset/Pixel: 2173890399880386, ลำลำลับแล — lablae.net.
Business: 379674212574656. Ad account: 2212928322107670.
The owner accepted Meta Business Tools terms in chat before dataset creation.
No automatic portfolio-wide Conversions API integration was enabled.

## Activation

Default is OFF. Deploy this revision, then configure server environment:

- META_MEASUREMENT_ENABLED=1 (kill switch: change to 0)
- META_PIXEL_ID=2173890399880386
- META_CAPI_ENABLED=0 until token, API version and test events are verified
- META_CAPI_ACCESS_TOKEN: server secret only, never Git or NEXT_PUBLIC
- META_GRAPH_API_VERSION: explicitly select a currently supported Graph API version
- META_TEST_EVENT_CODE: only during server-side test verification; remove for live use

Before activation, disable Meta automatic events, automatic advanced matching and
page/product metadata enrichment in Events Manager. Confirm the dataset is linked
to the restaurant ad account. Verify browser events in Test Events before optimizing ads.

## Events and privacy

Consent prompt starts with no selection; rejection does not prevent booking.
Public pages only. No Meta script is loaded before opt-in. Private booking/order/admin
routes revoke consent. Query/fragment URLs and unsafe initial referrers are excluded
from browser measurement, so tagged ad landings can be undercounted. This deliberately
conservative initial release needs an isolated clean-URL tracking design before ad
query attribution is enabled; do not strip customer URLs or leak them to Meta.

PageView + named menu, phone, directions, Messenger and booking-intent clicks.
Lead is emitted only after a successful booking request. It is not a confirmed table,
restaurant visit or Purchase. Shop-order creation is not reported as Purchase.
Booking Lead uses a deterministic opaque event ID shared by Pixel and CAPI.
CAPI only sends consented new bookings with a valid _fbp cookie, never replays.
No phone, name, notes, booking code, IP address or form values are sent by CAPI.
Meta Pixel itself processes browser/network data; this is explained at opt-in.

## Cost and failure bounds

No new paid service, polling, cron, AI calls, database table or retry queue.
Pixel events go directly from consenting browsers to Meta.
CAPI makes at most one outbound request for each newly saved eligible booking,
with a 2-second timeout and zero retries; it cannot create reservations or resend
old ones. For 100 eligible bookings/day this is <=3,000 requests/month. At timeout,
that is <=6,000 additional seconds of waiting/month, not a CPU-time estimate.
Incremental Railway cost cannot be quoted until the account's current plan/usage
is inspected. Do not enable CAPI before this check. Existing request abuse controls
still apply; this is not a global billing hard cap. META_CAPI_ENABLED=0 stops CAPI.
Failed CAPI attempts are dropped and logged without token or payload. This favors
booking reliability over guaranteed tracking delivery.

## Deployment status

Not deployed or activated. Railway login was blocked by automatic approval review
at the GitHub OAuth sign-in step. The host also displayed a Railway Platform Outage
banner. No production booking was submitted as a test.
