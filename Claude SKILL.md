---
name: call-sheet
description: >
  Convert raw production notes into a call-sheet JSON object for Tom's call-sheet app.
  Use this skill whenever Tom supplies raw shoot-day notes (WhatsApp threads, emails, voice-memo
  transcripts, mixed EN/JP text) and wants call-sheet data in return. Trigger phrases include:
  "make a call sheet", "fill in the call sheet", "create a call sheet", "prep the call sheet",
  or any time Tom drops in production notes and references a shoot day or schedule.
  Always use this skill — do not attempt to produce call-sheet data ad hoc without reading it first.
---

# Call Sheet Skill

Tom is a film director and producer based in Tokyo. He runs shoots for Japanese domestic clients and international broadcasters. His call sheets are operational documents — functional, precise, and used on-set by crew. The output of this skill is a JSON object that can be imported directly into his call-sheet app (via **Import** in the appbar) or shared as a compressed URL.

---

## What This Skill Does

Takes raw production notes in any format (WhatsApp, email, voice memo, mixed EN/JP) and converts them into a correctly structured JSON object matching the app's portable call-sheet format.

---

## JSON Format Rules

These rules are absolute. Never deviate from them.

### Top-Level Structure

```json
{
  "$version": 1,
  "meta": { ... },
  "logos": [],
  "sections": [ ... ],
  "pageBreaks": []
}
```

- `$version` is always `1`.
- `logos` is always an empty array `[]`. Never include logo data.
- `pageBreaks` is always an empty array `[]`.
- Output ONLY the JSON — no markdown fences, no prose, no explanation.

### Meta Object

All meta keys should be included, even if the value is an empty string:

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| `company` | string | `"Street Attack Japan K.K."` | Unless Tom overrides |
| `address` | string | `"2-13 Akasaka 9-chome, Minato-ku, Tokyo 107-0052"` | Unless Tom overrides |
| `project` | string | `""` | Project or production title |
| `client` | string | `""` | Client name / agency |
| `mainLocation` | string | `""` | Primary shoot location |
| `date` | string | `""` | Format: `YYYY.MM.DD (DAY-ABBREV)` |
| `day` | string | `""` | Shoot day number as string |
| `shootCall` | string | `""` | Format: `07:00` (24h) |
| `emergency` | string | `""` | Emergency contact info |
| `weatherCallout` | string | `""` | Weather description |
| `sunrise` | string | `""` | Format: `5:47` |
| `sunset` | string | `""` | Format: `7:40` |

### Section Types

Sections appear in a `sections` array. Each section has `type`, `title`, and `data`.

#### SCHEDULE

```json
{
  "type": "schedule",
  "title": "Schedule",
  "data": [
    { "type": "row", "time": "07:00", "dur": "1h", "task": "LOAD IN", "loc": "Location address", "cast": "", "note": "Crew call" },
    { "type": "row", "time": "08:00", "dur": "4h", "task": "SCENE 1", "loc": "Studio A", "cast": "Cast names", "note": "Any notes" },
    { "type": "span", "time": "12:00", "dur": "1h", "text": "LUNCH" },
    { "type": "span", "time": "17:00", "dur": "", "text": "WRAP" }
  ]
}
```

- `type=row` for normal schedule rows. Fields: `type`, `time`, `dur`, `task`, `loc`, `cast`, `note`.
- `type=span` for full-width dividers: LUNCH, WRAP, TRAVEL, BREAK. Fields: `type`, `time`, `dur`, `text`. No `task`/`loc`/`cast`/`note` fields on spans.
- All values are strings. Use `""` for blank fields, not `null`.
- `dur` format: `1h`, `30m`, `1h30m`. Leave blank if unknown.
- Times in 24h format.

#### CONTACTS (repeatable)

```json
{
  "type": "contacts",
  "title": "Crew Contacts",
  "data": [
    { "role": "Producer", "name": "Jane Doe", "phone": "+1 555 555 5555" },
    { "role": "Director", "name": "John Smith", "phone": "john@example.com" }
  ]
}
```

- `role`, `name`, `phone` are all strings. Use `""` for blank fields.
- Title after `contacts` is free text — group contacts logically (e.g. "Crew Contacts", "Client", "Talent", "Vendors").
- Repeat the block for each group. Multiple CONTACTS sections are fully supported.
- `phone` accepts phone numbers, email addresses, or both.

#### EQUIPMENT

```json
{
  "type": "equipment",
  "title": "Equipment Checklist",
  "data": [
    { "text": "FX6 + rigging + batteries", "done": false },
    { "text": "FX3 + batteries", "done": false }
  ]
}
```

- `text` is the item description (string).
- `done` is a boolean, always `false` unless Tom explicitly says an item is confirmed/packed.

#### HOSPITAL

```json
{
  "type": "hospital",
  "title": "Nearest Hospital",
  "data": {
    "name": "Hospital name",
    "addr": "Full street address",
    "phone": "+1 555 555 5555",
    "hours": "24h / ER",
    "dist": "~6 mi / 15 min"
  }
}
```

- All values are strings. Use `""` for blank fields.

#### BASECAMP

```json
{
  "type": "basecamp",
  "title": "Parking / Basecamp",
  "data": {
    "name": "Basecamp name",
    "addr": "Address",
    "parking": "On-site parking note",
    "restroom": "Restroom location",
    "catering": "Catering note"
  }
}
```

- All values are strings. Use `""` for blank fields.

#### NOTES

```json
{
  "type": "notes",
  "title": "Notes",
  "data": {
    "text": "Free-text notes."
  }
}
```

- `text` is a plain string (no HTML, no markdown). Newlines are fine in JSON strings.

---

## Section Inclusion Rules

- **Only include sections that have real content.** Skip empty sections entirely.
- SCHEDULE and CONTACTS (at minimum one) should almost always be present.
- HOSPITAL and BASECAMP: include only if Tom provides location data.
- NOTES: include only if there are miscellaneous notes that don't fit elsewhere.
- Include all meta keys even if blank — the app handles empty fields gracefully.

---

## Multi-Day Shoots

If notes cover multiple days, produce one JSON object per day in a simple array:

```json
[
  { "$version": 1, "meta": { ... }, "logos": [], "sections": [ ... ], "pageBreaks": [] },
  { "$version": 1, "meta": { ... }, "logos": [], "sections": [ ... ], "pageBreaks": [] }
]
```

- Export each day as its own `.callsheet.json` file and import individually.
- Repeat CONTACTS blocks across days only if there are changes — otherwise Tom can re-use.

---

## Handling Raw Notes

Tom's notes may arrive as:
- WhatsApp threads (timestamps, names, mixed languages)
- Email chains (quoted replies, forwarded messages)
- Voice-memo transcripts (informal, fragmented)
- Mixed English/Japanese text

**Extraction priorities:**
1. Pull all times into SCHEDULE rows, inferring task names from context.
2. Extract all named people and their roles into CONTACTS.
3. Pull equipment mentions into EQUIPMENT.
4. Pull any location-specific info (parking, hospital, basecamp) into the relevant sections.
5. Any stray information that doesn't fit a typed section goes into NOTES.

If a field cannot be inferred, leave it as an empty string rather than inventing a value. Do not omit keys.

---

## Default Values (Tom's Productions)

Unless the notes override these:

| Field | Default |
|---|---|
| `company` | Street Attack Japan K.K. |
| `address` | 2-13 Akasaka 9-chome, Minato-ku, Tokyo 107-0052 |
| Equipment `done` | false |

---

## Workflow

When Tom triggers this skill:

1. **Read all notes** before producing any output.
2. **Identify how many shoot days** are present. If ambiguous, treat as one day.
3. **Produce valid JSON** in strict compliance with the format above.
4. **Output ONLY the raw JSON** — no explanation, no code fences, no preamble.
5. After outputting the JSON, add one brief line: *"Save as `shoot-YYYY-MM-DD.callsheet.json` and import via the Import button in the appbar."*

---

## Complete Template (Reference)

```json
{
  "$version": 1,
  "meta": {
    "company": "Street Attack Japan K.K.",
    "address": "2-13 Akasaka 9-chome, Minato-ku, Tokyo 107-0052",
    "project": "PROJECT NAME",
    "client": "CLIENT NAME",
    "mainLocation": "City / Country",
    "date": "2026.04.28 (TUE)",
    "day": "1",
    "shootCall": "07:00",
    "emergency": "Producer Name — +1 555 555 5555",
    "weatherCallout": "PARTLY CLOUDY · 64° / 45°F",
    "sunrise": "5:47",
    "sunset": "7:40"
  },
  "logos": [],
  "pageBreaks": [],
  "sections": [
    {
      "type": "schedule",
      "title": "Schedule",
      "data": [
        { "type": "row", "time": "07:00", "dur": "1h", "task": "LOAD IN", "loc": "Location address", "cast": "", "note": "Crew call" },
        { "type": "row", "time": "08:00", "dur": "4h", "task": "SCENE 1", "loc": "Studio A", "cast": "Cast names", "note": "" },
        { "type": "span", "time": "12:00", "dur": "1h", "text": "LUNCH" },
        { "type": "span", "time": "17:00", "dur": "", "text": "WRAP" }
      ]
    },
    {
      "type": "contacts",
      "title": "Crew Contacts",
      "data": [
        { "role": "Producer", "name": "Jane Doe", "phone": "+1 555 555 5555" },
        { "role": "Director", "name": "John Smith", "phone": "john@example.com" }
      ]
    },
    {
      "type": "contacts",
      "title": "Client",
      "data": [
        { "role": "Client Lead", "name": "Client Name", "phone": "" }
      ]
    },
    {
      "type": "equipment",
      "title": "Equipment Checklist",
      "data": [
        { "text": "FX6 + rigging + batteries", "done": false },
        { "text": "FX3 + batteries", "done": false }
      ]
    },
    {
      "type": "hospital",
      "title": "Nearest Hospital",
      "data": {
        "name": "Hospital name",
        "addr": "Full street address",
        "phone": "+1 555 555 5555",
        "hours": "24h / ER",
        "dist": "~6 mi / 15 min"
      }
    },
    {
      "type": "basecamp",
      "title": "Parking / Basecamp",
      "data": {
        "name": "Basecamp name",
        "addr": "Address",
        "parking": "On-site parking note",
        "restroom": "Restroom location",
        "catering": "Catering note"
      }
    },
    {
      "type": "notes",
      "title": "Notes",
      "data": {
        "text": "Free-text notes."
      }
    }
  ]
}
```
