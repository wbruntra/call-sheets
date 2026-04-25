# Call Sheets

A browser-based call sheet editor for film and TV production. No account required — everything runs in your browser and is saved locally.

**Live app:** https://wbruntra.github.io/call-sheets/

## Features

- Create and manage call sheets across multiple shoot days
- Edit sections inline (cast, crew, schedule, equipment, notes, and more)
- Add production logos
- Insert page breaks for print layout
- Share a day via a compressed URL (no server needed)
- Export/import as JSON for backups and cross-device transfer
- Password-protected encrypted export for sensitive call sheets
- Import from CSV

## Usage

Open the app at https://wbruntra.github.io/call-sheets/ — no installation needed. Data is stored in your browser's local storage.

To share a call sheet, use the **Share** button to copy a link or download a JSON file. Recipients can open the link directly or import the file.

## Local development

```sh
cd vite-project
bun install
bun run dev
```

## Deploy

```sh
cd vite-project
bun run deploy
```

Builds and publishes to the `gh-pages` branch, which serves the app at https://wbruntra.github.io/call-sheets/.
