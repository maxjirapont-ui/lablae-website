# แวะลับแล — first collection

The owner authorized adapting the restaurant Facebook page into an expandable website section separate from the book. `/visit` and `/visit/[slug]` are independent of `/blog` and its database chapters.

## Sources checked

- Facebook page: https://www.facebook.com/lumlumlablae/ (read through the signed-in browser).
- “แกงแคที่เมื่อก่อนไม่ชอบกิน”, September 9, 2026: https://www.facebook.com/lumlumlablae/posts/pfbid034nFds7EqeZtnB3JSnvptsy9j5JycsahjBg9MD3QnddMjRMWHoq1cuyY71jsmE7Y2l . Full copy was readable in the content library. Restaurant-owned image saved to `public/images/visit/gaeng-kae.jpg`. Adaptation omits broader chemical-free/health claims.
- Directions reel, November 2, 2025: https://www.facebook.com/reel/1149917793384285/ . Its visible caption recommends starting at Laplae gate. Turn-by-turn directions and expanded parking are from the owner's instructions in this conversation, not inferred from unseen video.
- Two-person khantoke recommendation, rice wraps, small-group walk-ins, approximately 8-person advance bookings, long tables, faster service and expanded parking: owner statements in this conversation.
- House photograph copied from the existing website's `home_about_image` setting: `/uploads/1788548475968_10j12o.jpg`.

## Adding future stories

Add a reviewed entry to `src/lib/visit-articles.ts` with a stable English slug, Thai title, category, excerpt, accurate image and alt text, paragraphs, and original public post URL when applicable. Listing cards, related links, metadata, Article structured data and sitemap entries use this collection automatically. Deploy through the normal website release process. This is curated publishing, not automatic Facebook synchronization and not the existing book editor.

Keep historical stories in the book. Check current menu, hours and travel details before reusing old promotional copy. Do not invent customer reviews or assume travel times from Bangkok or Highway 11. Use source images belonging to the restaurant, not third-party review photos without authorization.

## Validation

Production build and analytics unit tests pass. Browser checks cover 390/1024/1440 widths, four article routes, canonical links, JSON-LD, image decoding, navigation, missing-article 404, and sitemap entries. Local seed database references absent uploaded logo files; deployed logo is checked separately on production.
