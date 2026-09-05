# Design QA — Quick Facts real-photo cards and Arabic numerals

## Evidence

- Source visual truth: `qa-source-before.png`
- Final implementation: `qa-implementation-after-wide.png`
- Responsive implementation check: `qa-implementation-after.png`
- Admin cover-image control: `qa-admin-cover-picker.png`
- Source URL: `https://lablae-website-production.up.railway.app/`
- Implementation URL: `http://localhost:3005/`
- Primary comparison viewport: 1280 × 720 CSS px; source and implementation captures are both 1280 × 720 px at 1× density, so no density normalization was required.
- Responsive check viewport: 724 × 762 CSS px and screenshot pixels at 1× density.
- State: homepage “เรื่องเล่าจากบ้าน 100 ปี” section; production before-state compared with the revised local implementation. Admin was authenticated and checked in the “รูปบรรยากาศและหน้าปก” section.

## Full-view comparison evidence

- The revised section preserves the source page's two-column composition, typography hierarchy, dark teak palette, warm accent, spacing rhythm, borders, radii, and the adjacent house photograph.
- The four emoji-style symbols are replaced by photographs already uploaded by the restaurant. No generated imagery is used in the implementation.
- Thai numerals in the source are consistently shown as Arabic digits in the implementation, including values coming from persisted settings, menu text, and article content.

## Focused-region comparison evidence

- The quick-fact cards were inspected closely at desktop and the narrower responsive viewport. Their labels and CTA remain readable, while the larger 4:3 crops make the real subjects recognizable.
- The story modal was opened from a quick-fact card. Its header and navigation now use the same real photographs, and the existing gallery and CTA remain functional.
- The authenticated admin view was checked. Each story tab uses its real cover image, the selected image is marked “ภาพหน้าการ์ด”, and other uploaded images expose the “ใช้เป็นภาพหน้าการ์ด” action.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: the existing Thai font families, weights, line heights, wrapping, and hierarchy are preserved; Arabic numerals match the surrounding font treatment.
- Spacing and layout rhythm: the original card grid and section proportions are preserved. The image crop expansion does not introduce overflow or collision at the tested viewports.
- Colors and visual tokens: existing brown, cream, and accent tokens are unchanged; photo borders and controls reuse existing accent colors.
- Image quality and asset fidelity: all visible card imagery is sourced from the restaurant's uploaded photo library. Crops use `object-cover`, remain sharp at their rendered size, and no emoji, generated art, placeholder, or handcrafted SVG replaces the subjects.
- Copy and content: labels are unchanged except for the requested numeral conversion and prior copy cleanup. Saved content is migrated once and future admin saves normalize Thai digits to Arabic digits.
- Browser behavior: homepage rendering, quick-fact card opening, story modal rendering, admin authentication, photo-section navigation, and cover-image controls were inspected. No client error overlay or application error appeared during these interactions, and the development server log contained no runtime exception.

## Comparison history

1. Initial comparison found a P2 image-recognition issue: the first implementation used 56–64 px square thumbnails, which still read too much like replacement icons.
2. Fix: expanded each card image to the full available card width with a 4:3 crop and slightly tightened card padding.
3. Post-fix evidence: `qa-implementation-after-wide.png` and `qa-implementation-after.png` show recognizable real photographs without changing the surrounding layout or causing overflow.

## Implementation checklist

- [x] Replace the four customer-facing emoji symbols with real uploaded photographs.
- [x] Use real photos in the story modal header and navigation.
- [x] Add an admin control to select the cover photo for each quick fact.
- [x] Convert visible Thai numerals to Arabic digits in source defaults and existing persisted content.
- [x] Normalize future admin saves for settings, menu copy, and article copy.
- [x] Verify lint, production build, homepage, modal, and authenticated admin view.

## Follow-up polish

- P3: when the restaurant has a single photograph showing several generations together, it would communicate “4 รุ่นคน” more directly than the current portrait. The admin cover selector now makes that swap immediate.

final result: passed
