# Changelog

## 1.15.2

- Unify dark-mode hover and keyboard focus for live links and controls under `interaction-hover` (the existing gold accent by default), including inherited link titles and the mobile menu icon. Cover automatic and explicit dark mode while preserving resting colours, light-mode palettes, images and focus outlines.

## 1.15.1

- Centre the article end square on its own final line when no reliable ending paragraph is available. Suppress the prose separator's width on standalone marks so the square itself is centred, including after private content is unlocked.

## 1.15.0

- Close the Letterbox home index with the same 7px solid square that ends an article, centred on the title axis below the last entry and linking to the top of the page. Colour follows the index title and turns to the index-hover colour on hover and keyboard focus, with a 44px target, visible focus outline and the “Back to top” name.
- Give the Letterbox home header the `page-top` anchor so the link works without JavaScript and returns to the full top bar. Classic home markup is unchanged.

## 1.14.2

- Replace the article end mark’s underline with a colour change using the existing index-hover palette (falling back to the link colour). Preserve the square, touch target, stationary layout and visible keyboard focus outline.

## 1.14.1

- Align the article end mark’s hover and keyboard underline with the 7px square itself, leaving a 4px gap instead of underlining the preceding space. Keep paragraph layout and the expanded touch target unchanged.

## 1.14.0

- Put a small solid square at the end of the final paragraph and use it as the native Back to top link. Preserve authored HTML and line height, with a nonbreaking gap, accessible label and expanded touch target. Media endings use a separate right-aligned line; private articles get the marker after unlocking.
- Remove the middle footer diamond and retain two equal columns for adjacent articles. The end mark also works on articles without adjacent links and without JavaScript.

## 1.13.9

- Protect Letterbox title descenders with bottom padding before the following paper surface and seam strip. Keep title position and typography unchanged while increasing the title-to-content gap by 0.5rem on desktop, mobile and short windows.

## 1.13.8

- Replace the article-end up chevron with a small hollow diamond, retaining the centred 44px target, accessible name, stationary hover and keyboard feedback.
- Account for the Letterbox bar and top safe area in native page-top navigation so the entire bar is visible after returning from an article footer, including without JavaScript. Cover both designs, browser engines, mobile/desktop, keyboard activation and fragment reloads.

## 1.13.7

- Centre Letterbox subtitles within the entire lower bar, including Home Screen safe areas. Reserve symmetrical space for up to two lines and share the resulting height with the cover, preserving the first-screen fit across rotation and enlarged text.
- Cover centring before and after scrolling, changing safe areas, responsive resizing, and 200% text in Chromium and WebKit regression checks.

## 1.13.6

- Paint matching paper across both sides of the title-header seam, preventing the dark body from bleeding through at fractional display scales without changing layout or home navigation.
- Share `--lb-cover-position` between the Letterbox cover image and its placeholder so sites can adjust the focal point for their own image and viewport shapes.

## 1.13.5

- Complete Letterbox Home Screen support with Apple standalone status-bar metadata and `viewport-fit=cover`. Both body and html keep the bar colour; the reading surfaces paint their own paper so iOS cannot sample the light body background.
- Respect top, bottom and landscape safe areas without fixing the navigation. The home cover subtracts the extra safe-area space, keeping its first screen at `100svh`; only the top system inset retains a fixed dark backing when scrolling.

## 1.13.4

- Adjacent-post navigation follows chronological order: Previous on the left opens the older post, Next on the right opens the newer post. The oldest and newest posts retain their empty left and right cells respectively, keeping Back to top centred.

## 1.13.3

- Letterbox uses the navigation bar colour for the root canvas and browser theme colour on every page, including the light home index. The reading surface retains its own background over the full document height; navigation continues to scroll with the page.

## 1.13.2

- Phones and short windows open on the same first screen as desktops: top bar, cover and a fixed-height lower bar fill `100svh` exactly, so nothing of the index shows before the first scroll.

## 1.13.1

- Article paragraphs are justified and no longer use `text-wrap: pretty`, which in WebKit re-balanced every line and left a ragged right edge in Chinese text.
- `cjk_punctuation`: a Chinese quote next to another full-width mark takes its half-width form (`halt`), and typed spaces between a Chinese quote and Chinese text or punctuation are not rendered.

## 1.13.0

- The letterbox home index takes its colours from optional tokens `index-bg`, `index-title`, `index-meta` and `index-hover`, set per scheme in `colors.light` / `colors.dark`; unset, it keeps the bar's blue-black. Its keyboard focus ring follows the hover colour.
- On phones the in-flow lower bar has equal top and bottom padding (1.5rem) and the index starts 2.5rem below it, so a differently coloured index meets a finished bar.
- Article text uses `text-autospace: normal` (hairline space where Han meets Latin or digits) and paragraphs use `text-wrap: pretty`.

## 1.12.1

- `home.subtitle_excerpts: false` keeps the slogan in the letterbox lower bar at all times; entries then carry no excerpt data.
- `archive.details` no longer adds year counts or photo counts: every post shows its word length and first sentence. The `posts` and `photos` labels are gone.

## 1.12.0

- Letterbox bars scroll with the document: the navigation sits at the document top and the home lower bar follows the cover in normal flow. Neither is fixed or returns on scroll-up; an open phone menu still pins its bar so it can be closed.
- Phones (≤767px) place each home date directly above its title on the shared centre axis instead of in a left track. Desktop and short windows keep the track layout.
- `home.cover_portrait` serves an art-directed crop to portrait phones through `<picture>` (WebP with JPEG fallback, `srcset`), with a matching preload; the wide cover is no longer downloaded there. The viewport meta now precedes the preloads so their media queries use the real width. `home.cover_placeholder` paints a tiny image or colour behind the cover while it loads.
- `cjk_punctuation` sets quotation marks, dashes and ellipses that touch Chinese text in the Chinese face (`fonts.cjk`, new `--font-cjk` token) at build time; the same characters in Latin text are unchanged.
- `custom_css_deferred` loads site stylesheets, such as an optional web-font fallback, without blocking the first paint.
- The menu collapses into the menu button below 768px instead of 992px.
- Letterbox title blocks sit on the page's own paper below the bar, with no band or rule; the text follows 3rem below (2.25rem on phones). The article date format is configurable (`post.date_format`, `post.year_format`) and set upright and muted.
- `archive.details` adds year counts, each post's length (or photo count for `photo_layout` posts) and its first sentence to letterbox listings. Private posts show neither. New helpers: `first_sentence`, `post_length`, `cjk_punct`.

## 1.11.0

- Centre every home title on the same axis as its year, with dates in a left track balanced by an equal empty track on the right. Use a 440px responsive measure and narrower side tracks on phones; undated and wrapped titles keep the same centre.

## 1.10.1

- Restore the home slogan when the pointer or keyboard focus leaves an article, including gaps within the index. Preserve excerpts while moving between a link’s children and clear pending fades when reduced motion is enabled.

## 1.10.0

- Letterbox navigation is fixed on every page and at every viewport size; preserve its geometry when menus or search open, disable boundary overscroll, and use stable 88px / 64px bars.
- Shared blue-black title cards reserve one date row and align page titles consistently without decorative rules.
- The home index includes every year and post in a continuous list. Centre the intrinsic width of the complete date-and-title block; long titles wrap and private-only years remain hidden until unlocked. Remove the old row/year capacity settings.
- Keep the existing contents-style Archives layout. Preserve keyboard focus on menu close and trap focus inside the open menu.

## 1.9.0

- Letterbox home holds a fixed amount: the latest public posts in at most `home.letterbox_rows` rows of four (default 3) from at most `home.letterbox_years` years (default 2); older posts live in the archive. The block is placed so a full one is centred, so the first year rests in the same place however many posts exist. Four columns at every letterbox width keep that capacity identical on tablets.
- Letterbox listings (archive, tags) read like a book's table of contents: a narrow centred column, small centred year, title left and italic date flush right, no rules or fills. Year-only posts leave the date blank; an archive note takes the date's place on the right and hangs a closing full-width bracket.

## 1.8.2

- Letterbox home: the lower bar shows a post's first sentence, whole, instead of an ellipsised excerpt. A sentence that does not fit one line wraps into two balanced lines inside the bar, whose size never changes; only a sentence longer than two lines is clamped. Phones show the same first sentence under each title, up to two lines.

## 1.8.1

- Letterbox home: the index is a second screen exactly as tall as the window between the bars, with its content centred, so the end of the page never shows the cover above it nor leaves the first year against the upper bar. Longer indexes grow with equal margins.
- Bars lower slightly on windows under 900px tall (`clamp(64px, 9.8vh, 88px)`, rounded); the height depends only on the window and is identical on every page.
- Short windows tighten the index rhythm; tablets keep three columns; very wide screens centre the bar contents and the index on a shared 1680px measure.

## 1.8.0

- Add the opt-in `design: letterbox`. One navigation bar of fixed height (88px; 64px on phones and short windows) appears on every page, with identical bar geometry across pages and a stable scrollbar gutter so short pages never shift it sideways.
- Content pages replace the colour-band masthead with a centred title block on the paper; posts show their date above the title (year only for year-precision posts). Archive and tag listings use italic `MM.DD` dates.
- The home page holds the cover between two fixed bars, followed by every post grouped by year in a four-column index (three below 1200px, two below 900px). The lower bar shows the slogan, or the excerpt of the entry under the pointer or focus, on one line that never changes height. No typing, parallax, snapping or scroll-driven motion.
- Private posts on the letterbox home are listed only for readers who have unlocked them, and never expose an excerpt.
- `classic` remains the default; existing sites are unchanged unless they opt in.

## 1.7.0

- Add opt-in desktop fog composition with five centered articles per column, one-column pagination, paired active page numbers, native history and reduced-motion support.
- Preserve the phone homepage and legacy cards by default. Short desktop windows reduce excerpts while keeping the page strip visible.
- Bundle an OFL-licensed Chinese serif fallback, requested only by the fog desktop homepage.

## 1.6.1

- Respect year-only dates in cards and chronological listings, and render optional archive annotations in muted, wrapping text.

## 1.6.0

- Centre a native Back to top chevron between adjacent-post links. All three arrows share the same 24px icon size, 2px stroke and rounded corners. Keep stationary colour/underline feedback, accessible labels, 44px targets and no-JavaScript navigation to the header.

## 1.5.3

- Use colour and a fine text underline for adjacent-post hover and keyboard focus feedback; remove moving-arrow animations.

## 1.5.2

- Keep the empty search panel stable during the first index request. Expose loading through the input’s busy state and show the loading row only after a query is entered; preserve errors and retry even without a query.

## 1.5.1

- Remove the mobile reading list’s gradient and its fade above the upper edge. Use a uniform translucent dark blue background with a direct boundary against the cover.

## 1.5.0

- Replace square cards at mobile widths (≤767px) with an unboxed reading list: date, full title, and a two-line excerpt separated by fine rules. Preserve the cover and serif typography, with a dark gradient into the list. Desktop and tablet layouts are unchanged.

## 1.4.1

- Give the desktop split home layout equal 20–24px card gaps and symmetric vertical breathing room. Preserve the centred twelve-position stage, left-first filling, square cards and existing tablet/mobile layout.

## 1.4.0

- Let navigation scroll away with the header on every page, preserving the initial layout. Remove scroll-triggered colour and size changes and the obsolete `nav.solid_after` setting.
- Keep the open mobile menu fixed and its brand and close button above the menu overlay.

## 1.3.1

- Fill the six left homepage positions before using the six right positions in `split` mode. Keep column positions fixed as articles are added and preserve the empty central strip.

## 1.3.0

- Add optional `home.layout: split`: balance up to twelve homepage cards into left and right wings, preserving an empty central strip of the cover on desktop. Scale square cards to the available width and retain the existing tablet/mobile reading order.

## 1.2.2

- Present optional companion links in a slim reading-width strip before adjacent-post navigation, using shared panel colours and an up-right arrow. Keep the same type scale as adjacent links and preserve their original two-column layout.

## 1.2.1

- Centre optional companion links between previous/next links in a balanced three-column footer. Share the navigation type scale and remove the separate rule and external-link icon. Preserve two-column navigation on unconfigured posts.

## 1.2.0

- Keep previous/next navigation centred on the ordinary reading column even on wide photography posts.
- Add an optional `companion` link after article content, with a quiet rule, a 44px touch target, and native HTTPS navigation. The theme takes labels and destinations from post metadata, hides the link on private posts, and leaves unconfigured posts unchanged.

## 1.1.0

- Add an opt-in, configurable Gallery with authored sequences, paired images, random selections, responsive previews and keyboard/touch image viewing.
- Add a standalone bilingual example, six desktop/mobile screenshots and local build/browser checks. No CI workflow.
- Require explicit photography layout selection; ordinary multi-image articles retain captions, headings and their reading column.
- Honour disabled search and image dialogs. Resolve search paths from the site configuration, and make private-archive requests opt-in.
- Add translated search loading/empty/error states, retry, modal focus management and keyboard image opening.
- Hide closed mobile navigation from keyboard and accessibility navigation.
- Show the complete mobile slogan immediately by default and provide a no-script fallback.
- Allow article language to differ from navigation language.
- Keep an explicit default colour scheme when it differs from the operating system.

## 1.0.0

Initial standalone release: editorial reading layout, image-led home page, dark mode, local search, native image dialog, configurable tokens and local vendored assets.
