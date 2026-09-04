# Optional Gallery

Enable `gallery.enable` in the site's `_config.bluenote.yml`. The module reads `source/_data/gallery.json`; change `gallery.data` to use another JSON filename in that directory. Missing data produces an intentional empty collection. Malformed data stops the build.

Gallery uses a wide editorial layout, native image dialogs, keyboard and touch controls, full-frame previews, and an authored complete view. The random view selects whole spreads so a diptych is never separated. Reshuffling changes only the current view, not the manifest.

## Image entry

```json
{
  "version": 1,
  "photos": [{
    "id": "first-photo",
    "alt": "A concise description of this image",
    "full": {"src": "/images/collection/first.jpg", "width": 6000, "height": 4000},
    "previews": [
      {"src": "/images/collection/first-800.jpg", "width": 800, "height": 533},
      {"src": "/images/collection/first-1600.jpg", "width": 1600, "height": 1067},
      {"src": "/images/collection/first-2880.jpg", "width": 2880, "height": 1920}
    ]
  }]
}
```

The dimensions above illustrate the format; use the real dimensions of your own files. Supported source files are local JPEG or PNG files below `source/images/`. Files, dimensions, ratios, preview sizes, paths and duplicate IDs are checked at build time.

Preserve the original framing and keep the full-resolution image separate from smaller previews. The original is requested only when the reader opens or changes a photo. The previous complete frame remains visible while the next one decodes. Neighbour preloading is limited to two previews.

Use `caption` only for text the author wants displayed. `alt` is required for accessibility and is not automatically turned into a visible Gallery caption.

For a diptych, give two adjacent entries the same `spread` ID. A spread contains at most two images. Optional `sequence` IDs mark contiguous runs of spreads. IDs must be lowercase and URL-safe; repeated non-contiguous spreads or sequences are rejected. The complete view preserves array order.

## Paths and language

```yaml
gallery:
  enable: true
  path: photographs
  data: selected
  title: Photographs
  language: zh-CN
  labels:
    few: A few
    all: All photographs
    reshuffle: Reshuffle
```

This produces `/photographs/` and `/photographs/all/`, under the site's configured root. Add the first path to `nav.menu`. The default route is `gallery`, default data file is `gallery.json`, and default title is `Gallery`.

English and Simplified Chinese labels are included. `gallery.language` defaults to the site language; any key in [labels.json](labels.json) may be overridden under `gallery.labels`.

## Progressive behaviour

With JavaScript disabled, the small view includes a few authored spreads and a link to the full collection. Without native dialog support, photographs remain ordinary links. Failed reshuffles keep the previous selection. Failed original downloads preserve a working preview and offer an original link.

Only Gallery pages load `gallery.css`, `gallery.js` and, for the random view, `gallery-selection.js`. Disabled galleries generate none of those assets. See the [complete minimal example](../../example/source/_data/gallery.json).
