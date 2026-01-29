# Jockamo Webhook Examples

## Webhook URL
```
https://primary-production-a88ea.up.railway.app/webhook/jockamo-chat
```

## cURL Example

```bash
curl -X POST "https://primary-production-a88ea.up.railway.app/webhook/jockamo-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hey, I need some advice about my relationship",
    "history": [],
    "timestamp": "2026-01-27T17:48:33.503Z"
  }'
```

### With conversation history:

```bash
curl -X POST "https://primary-production-a88ea.up.railway.app/webhook/jockamo-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I do next?",
    "history": [
      {"role": "user", "content": "Hey, I need some advice"},
      {"role": "assistant", "content": "Sure, what is going on?"}
    ],
    "timestamp": "2026-01-27T17:48:33.503Z"
  }'
```

## JavaScript Example

```javascript
async function sendMessage(message, history = []) {
  const response = await fetch('https://primary-production-a88ea.up.railway.app/webhook/jockamo-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      history: history,
      timestamp: new Date().toISOString()
    })
  });

  const data = await response.json();
  return data.output;
}

// Usage
sendMessage('Hey, I need some advice about my relationship', [])
  .then(response => console.log(response))
  .catch(error => console.error(error));
```

### With conversation history:

```javascript
const history = [
  { role: 'user', content: 'Hey, I need some advice' },
  { role: 'assistant', content: 'Sure, what is going on?' }
];

sendMessage('What should I do next?', history)
  .then(response => console.log(response));
```

## Request Format

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | The current user message |
| `history` | array | Previous conversation (alternating user/assistant objects) |
| `timestamp` | string | ISO timestamp of the message |

## Response Format

The webhook returns a JSON object with the AI response in the `output` field.
