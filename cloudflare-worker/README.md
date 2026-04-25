# Call Sheets Cloudflare Worker Backend

A free, zero-config backend for the Call Sheets app. Replaces jsonbin.io with your own Cloudflare Worker + KV storage.

## What you get

- **Free hosting**: 100,000 requests/day on Cloudflare's free tier
- **No CORS issues**: Worker sets proper `Access-Control-Allow-Origin` headers
- **No API keys needed**: Public read/write by design (this is a sharing tool)
- **Fast**: Edge-cached, global CDN

## Prerequisites

- A Cloudflare account (free)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed

## Setup (5 minutes)

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens a browser tab to authorize the CLI.

### 3. Create a KV namespace

```bash
cd cloudflare-worker
npx wrangler kv namespace create "CALLSHEETS_KV"
```

Copy the ID from the output. It looks like:

```
{ binding = "CALLSHEETS_KV", id = "a1b2c3d4e5f6..." }
```

### 4. Update wrangler.toml

Open `wrangler.toml` and paste your KV namespace ID:

```toml
[[kv_namespaces]]
binding = "CALLSHEETS_KV"
id = "a1b2c3d4e5f6..."  # <-- your ID here
```

### 5. Deploy

```bash
npx wrangler deploy
```

You'll get a URL like:

```
https://call-sheets-backend.your-account.workers.dev
```

### 6. Configure the frontend

Open the Call Sheets app, go to **Share → Cloud**, paste your worker URL in the **API URL** field, and you're done.

The URL should look like:

```
https://call-sheets-backend.your-account.workers.dev
```

No trailing slash needed.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/b` | Create a new bin (returns `{ metadata: { id } }`) |
| GET | `/b/<id>/latest` | Read a bin |
| PUT | `/b/<id>` | Update a bin |

Responses mirror jsonbin.io's format so the frontend works without changes.

## Updating the worker

If you modify `worker.js`, just re-deploy:

```bash
npx wrangler deploy
```

## Deleting old data

KV data persists until you delete it. To clean up:

```bash
npx wrangler kv:key list --namespace-id=YOUR_KV_ID
npx wrangler kv:key delete --namespace-id=YOUR_KV_ID <bin-id>
```

Or delete the entire KV namespace from the Cloudflare dashboard.
