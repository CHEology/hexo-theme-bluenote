# Changelog

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
