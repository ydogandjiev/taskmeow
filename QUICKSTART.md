# ChatGPT App - Quick Start Guide

Get your TaskMeow ChatGPT App running in 5 minutes!

## Prerequisites

- TaskMeow deployed with HTTPS
- Node.js and npm installed
- MongoDB database running

## Step 1: Generate API Key

```bash
npm run generate-api-key
```

Copy the generated key and update your `.env`:

```bash
CHATGPT_APP_API_KEY="tm_your_generated_key_here"
```

## Step 2: Build and Deploy

```bash
npm install --legacy-peer-deps
npm run build
npm start
```

## Step 3: Verify MCP Server

Test the health endpoint:

```bash
curl https://your-domain.com/mcp/health
```

You should see:

```json
{
  "status": "ok",
  "server": "taskmeow-mcp-server",
  "version": "1.0.0",
  "protocol": "2024-11-05"
}
```

## Step 4: Test with curl

Test the initialize endpoint:

```bash
curl -X POST https://your-domain.com/mcp/initialize \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": 1
  }'
```

Test getting tasks:

```bash
curl -X POST https://your-domain.com/mcp/tools/call \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_tasks",
      "arguments": {
        "userEmail": "your.email@example.com"
      }
    },
    "id": 2
  }'
```

## Step 5: Create ChatGPT App

1. Go to [OpenAI Platform](https://platform.openai.com/apps)
2. Click "Create App"
3. Fill in:

   - **Name**: TaskMeow
   - **Description**: Manage your TaskMeow tasks
   - **MCP Server URL**: `https://your-domain.com/mcp`
   - **API Key**: Your generated API key

4. Add instructions:

```
You are TaskMeow Assistant. Help users manage their to-do lists using these tools:

- get_tasks: List all tasks
- create_task: Add new tasks
- update_task: Modify tasks (title, starred, order)
- delete_task: Remove tasks
- get_task_widget: Show visual widget

Always use the user's email address for all operations.
Be conversational and helpful!
```

5. Save and publish

## Step 6: Test in ChatGPT

Open ChatGPT and select your TaskMeow app. Try:

- "Show me my tasks"
- "Add a task to buy groceries"
- "Star the first task"
- "Show me the task widget"

## Troubleshooting

### "Authentication required"

- Check API key in `.env` matches ChatGPT App config
- Restart server after changing `.env`

### "User not found"

- User must exist in TaskMeow database
- Email must match exactly
- Log into TaskMeow web app first to create account

### Rate limiting

- Wait 15 minutes if you hit the limit (1000 req/15min)

## Next Steps

- Read full documentation: [CHATGPT_APP.md](CHATGPT_APP.md)
- Customize app instructions
- Share with your team
- Add more features!

## Need Help?

- Full docs: `CHATGPT_APP.md`
- Apps SDK: https://developers.openai.com/apps-sdk
- GitHub Issues: https://github.com/ydogandjiev/taskmeow/issues

🎉 **You're all set!** Manage tasks from ChatGPT!
