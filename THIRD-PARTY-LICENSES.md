# Bundled third-party components

| Component | Version | License | Where |
| --- | --- | --- | --- |
| typed.js | 2.0.12 | MIT (Matt Boldt) | `source/vendor/typed.js/2.0.12/` — loaded on the home page only, for the slogan typing effect |
| github-markdown-css | 4.0.0 | MIT (Sindre Sorhus) | `assets/css/60-markdown.css` — base typography of `.markdown-body`, with octicon/anchor/task-list rules removed |
| highlight.js styles `github` and `dark` | 11.12.0 | BSD-3-Clause (Ivan Sagalaev and contributors) | `assets/css/80-highlight.css` — code block colours, scoped by colour scheme |

| Noto Serif SC | Fontsource 5.2.9 distribution | SIL Open Font License 1.1 (Adobe / Google) | `source/fonts/` — unicode subsets for the desktop fog homepage; `source/fonts/LICENSE` |

The license texts are kept next to each copy (`LICENSE.txt` beside typed.js, header comments in the CSS files).
No other third-party components are bundled; there are no runtime requests to other hosts.
