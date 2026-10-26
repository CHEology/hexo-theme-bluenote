# Notes

An optional stream of short, timestamped texts kept apart from posts. Disabled by default.

## Content

One Markdown file per note in `source/<dir>/` (default `source/_notes/`). Hexo ignores underscore folders, so notes never become posts.

- **Filename** — the note's id and URL: letters, digits and hyphens, up to 64 characters. `YYYYMMDD-HHmmss.md` is a good convention.
- **`date`** — required, `YYYY-MM-DD HH:mm:ss` (or `HH:mm`) in the site `timezone`.
- **`updated`** — optional, same format.
- **`tags`** — optional list. Each tag is one word without spaces, slashes, `?`, `#`, `%`, quotes or angle brackets, at most 40 characters, not starting with a dot.
- **Body** — Markdown, rendered through Hexo's post pipeline (tag plugins and `after_post_render` filters apply). Links that start with `/` get the site root.

## Options

| Key | Default | Meaning |
| --- | --- | --- |
| `notes.enable` | `false` | Turn the module on |
| `notes.path` | `notes` | URL path of the timeline |
| `notes.dir` | `_notes` | Underscore folder inside `source/` |
| `notes.title` | `Notes` | Page title |
| `notes.per_page` | `30` | Notes per timeline page; `0` keeps all on one page |
| `notes.date_format` | `YYYY.MM.DD HH:mm` | Display date (Moment format) |
| `notes.noindex` | `true` | `<meta name="robots" content="noindex">` on every notes page |
| `notes.search` | `true` | The notes pages' own search box |
| `notes.language`, `notes.labels` | site language, `{}` | Built-in `en` and `zh-CN` labels; override any key from `labels.json` |
| `notes.compose.repo`, `notes.compose.branch` | empty, `main` | Emit a composer mount (see below) |

## Generated files

- `/<path>/`, `/<path>/page/<n>/` — timeline, newest first
- `/<path>/<id>/` — one note
- `/<path>/tags/<tag>/` — all notes with a tag
- `/<path>/search.json` — `{ version, notes: [{ id, url, file, datetime, date, tags, text, html }] }`
- `/<path>/tags.json` — `{ version, tags: [{ name, count }] }`, most used first
- `/css/notes.css`, `/js/notes.js` — loaded only on notes pages

## Markup for a site composer

When `notes.compose.repo` is set, the first timeline page contains

```html
<div class="notes-composer" data-notes-composer data-repo="owner/name" data-branch="main"
     data-dir="source/_notes" data-tags-url="/notes/tags.json" hidden></div>
```

Every note is `<article class="note" data-note-id="<id>" data-note-file="<id>.md">` with `.note__meta`, `.note__body.markdown-body` and an optional `.note__tags`. After the notes search renders results it dispatches `bluenote:notes-rendered` on the `.notes` element, and `window.BlueNoteNotes.reset()` makes the next search reload its index. The theme provides no posting code, credentials or network requests beyond its own files.
