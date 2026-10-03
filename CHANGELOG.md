# Changelog

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
