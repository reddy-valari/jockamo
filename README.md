# Jockamo Chat

AI relationship coach chat interface powered by n8n webhooks.

## Setup

### 1. Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings > Pages**
3. Source: **GitHub Actions**
4. The deploy workflow will run automatically on push

### 2. Configure n8n Webhook

1. Create a webhook workflow in n8n (see below)
2. Open the deployed site
3. Click "Configure Webhook"
4. Paste your n8n webhook URL

### n8n Workflow

The front-end sends POST requests with:

```json
{
  "message": "user's message",
  "history": [{"role": "user/assistant", "content": "..."}],
  "timestamp": "ISO string"
}
```

Expected response:

```json
{
  "message": "Jockamo's response"
}
```

## Local Development

Just open `index.html` in a browser. For testing with n8n:

```bash
# Simple HTTP server
python -m http.server 8080
# Then open http://localhost:8080
```

## Features

- Dark theme matching Jockamo's brand
- Conversation history saved locally
- Mobile responsive
- Configurable webhook URL
- XSS protection
