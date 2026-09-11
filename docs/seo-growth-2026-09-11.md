# Website growth changes — 11 September 2026

Release status: prepared and tested locally. User explicitly authorized sending this scoped change to `maxjirapont-ui/lablae-website` and updating production on 11 September 2026. Deployment verification pending. Release branch: `codex/seo-growth-20260911`.

## Website

- Menu title and search description now explicitly mention menus, prices, khantoke and local Laplae food.
- Menu heading clarifies prices while preserving custom admin headings.
- Menu includes directions and relevant links to the vegetable rice wrap article, house story and Laplae page.
- Articles include links to menus/prices, directions and advance booking.
- Menu images load lazily and decode asynchronously.
- Pinned Facebook caption: `website-pinned-post-2026-09-11.txt`. Draft only; not published.

## Google Business Profile

Menu link changed to:
https://www.lablae.net/menu?utm_source=google&utm_medium=organic&utm_campaign=business_profile&utm_content=menu

Google accepted the menu change. Website link submitted below; initially pending Google review:
https://www.lablae.net/?utm_source=google&utm_medium=organic&utm_campaign=business_profile&utm_content=website

## Analytics activation still required

Analytics code is prepared but OFF by default. Root layout mounts it only when server environment `WEBSITE_ANALYTICS_ENABLED=1`.

The Google Analytics interface returned `ERR_CONNECTION_REFUSED` twice, so stream settings could not be verified. Before activation, verify that measurement ID `G-8ZCYCYC7JY` belongs to the public lablae.net stream, and disable Enhanced Measurement (including history page views, forms and site search) in that stream. The site sends explicit page views; automatic history events can double-count and capture unfiltered URLs even with `send_page_view: false`.

Then enable the server flag and verify Realtime with a tagged visit and menu/directions actions. No attribution should be claimed before activation. UTMs already route correctly but are not currently collected by this change.

Prepared events: `menu_click`, `directions_click`, `phone_click`, `booking_click`, `booking_request_submitted`. Clicks measure intent, not completed calls/visits; submitted requests are not confirmed bookings. Only production public restaurant pages and named campaign labels are allowed. Admin, booking status, shop, local hosts, arbitrary queries and form values are excluded by the custom code. Recheck future changes to Maps short links against the directions allowlist.

Validation: production build and TypeScript passed; four analytics tests passed; changed-file lint had zero errors and six existing warnings. Isolated release excludes the pre-existing shop preview changes. Local browser verified menu heading, prices, directions link and article cross-links.
