# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-04-24 | self | Used `React.Fragment` in KVSection without importing React | Use `{ Fragment }` import from 'react' instead |
| 2026-04-24 | self | Had stray `</div>` in Section.jsx from removing fragment wrapper | Verify JSX nesting when removing wrapper elements |
| 2026-04-24 | self | useCallSheet imported DEFAULT_DAY_DATA/BLANK_DAY_DATA from utils.js but they're in data/defaults.js | Fix import path to `../data/defaults` |
| 2026-04-24 | self | `sed` to replace `Editable` also corrupted `contentEditable` and `suppressContentEditableWarning` in SheetHeader.jsx | Be more precise with sed patterns or use edit tool for targeted replacements |

## User Preferences
- User prefers PNG files over inline base64/JS text for images
- User prefers using bash/command-line tools to extract code rather than rewriting from scratch
- Default Vite shell project as starting point

## Patterns That Work
- Extracting code from original monolithic HTML via Node.js evaluation of data factories
- Porting CSS as-is preserves class names for 1:1 mapping between original and React components
- Building components in parallel (all section types at once) is efficient
- `<input>` elements break flex/grid alignment in headers (inline-replaced); `contentEditable` divs/spans match original CSS selectors and layout
- Immer `produce()` is a drop-in replacement for `JSON.parse(JSON.stringify())` mutable clone pattern
- Centralizing shared logic (API calls, prompts, JSON repair) in `utils.js` reduces duplication significantly
- EditModeContext gives view-only render without duplicating components
- lz-string compresses ~2-3KB JSON to ~800B URLs, making shareable links viable
- $version field in shared/store JSON enables future schema migrations

## Patterns That Don't Work
- Leaving `Editable` component defined inside `SheetHeader.jsx` instead of extracting it — other components need it too

## Domain Notes
- Original app is a self-unpacking HTML file with embedded manifest, template HTML, and gzipped JS/CSS
- App uses `contenteditable` divs with `data-k` attributes for data binding in original; React version uses controlled Editable component
- CSS classes used as feature toggles: `body.editing`, `body.hide-jp`, `body.hide-logo`, `body.tweaks-open`
- Section types: schedule, contacts, equipment, hospital, basecamp, notes
- Store shape: `{ days: [...], currentDayId, tweaks: { showJP, showLogo } }`
- Each day: `{ id, meta, logos, pageBreaks, sections }`
- Page breaks can be before a section (`{before: sectionId}`) or before a row in a schedule section (`{beforeRow: {sectionId, idx}}`)