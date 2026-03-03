# ChatGPT App Integration for TaskMeow

## Overview

TaskMeow integrates with ChatGPT as a **ChatGPT App** using the Apps SDK and MCP (Model Context Protocol) server. This allows users to manage their TaskMeow tasks directly from ChatGPT using natural language.

## What is a ChatGPT App?

ChatGPT Apps use the **Apps SDK** from OpenAI, which provides:

- **MCP Server**: A JSON-RPC 2.0 server that exposes tools ChatGPT can call
- **Server-to-Server Communication**: Direct communication without browser redirects
- **Simple Authentication**: API key authentication instead of OAuth flows
- **Seamless Integration**: No user consent flows needed

## Architecture

```
ChatGPT ←→ MCP Server (/mcp) ←→ TaskMeow Database
              ↓
          Task CRUD Operations
          Widget Generation
```

### Components

1. **MCP Server** (`server/mcp-server.js`)

   - JSON-RPC 2.0 protocol implementation
   - Exposes 5 tools for task management
   - API key authentication
   - Rate limiting (1000 req/15min)

2. **Tools Available**

   - `get_tasks` - List all tasks
   - `create_task` - Create a new task
   - `update_task` - Update task properties
   - `delete_task` - Delete a task
   - `show_tasks_widget` - Show embeddable widget

3. **Authentication**
   - API key-based (simple header authentication)
   - No OAuth flows or user consent screens
   - Server-to-server only

## Setup Instructions

### 1. Generate API Key

```bash
npm run generate-api-key
```

Copy the generated API key and add it to your `.env`:

```bash
CHATGPT_APP_API_KEY="tm_your_generated_key_here"
```

### 2. Build and Deploy

```bash
npm install --legacy-peer-deps
npm run build
npm start
```

### 3. Verify MCP Server

Test the health endpoint:

```bash
curl https://your-domain.com/mcp/health
```

Expected response:

```json
{
  "status": "ok",
  "server": "taskmeow-mcp-server",
  "version": "1.0.0",
  "protocol": "2024-11-05"
}
```

### 4. Create ChatGPT App

1. Go to the [OpenAI Platform](https://platform.openai.com/apps)
2. Click "Create App"
3. Fill in the app details:

   - **Name**: TaskMeow
   - **Description**: Manage your TaskMeow tasks
   - **MCP Server URL**: `https://your-domain.com/mcp`
   - **API Key**: (the key from your `.env`)

4. Configure the app instructions:

```
You are TaskMeow Assistant, helping users manage their to-do lists.

When users want to see their tasks:
- Use the get_tasks tool
- Present results in a clear, numbered list
- Highlight starred tasks with ⭐

When users want to add tasks:
- Use the create_task tool
- Confirm task creation
- Ask if they want to star important tasks

When users want to update tasks:
- Use the update_task tool to modify title, starred status, or order
- Confirm the changes

When users want to delete tasks:
- Use the delete_task tool
- Provide clear confirmation

Display the interactive widget when users want to visualize their tasks.
Be conversational and helpful!
```

5. Save and publish the app

## MCP Protocol Details

### Endpoints

All MCP endpoints use POST requests with JSON-RPC 2.0 format:

#### 1. Initialize

```
POST /mcp/initialize
```

Request:

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "id": 1
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {
      "name": "taskmeow-mcp-server",
      "version": "1.0.0"
    },
    "capabilities": {
      "tools": {},
      "resources": {}
    }
  },
  "id": 1
}
```

#### 2. List Tools

```
POST /mcp/tools/list
```

Returns all available tools with their schemas.

#### 3. Call Tool

```
POST /mcp/tools/call
```

Request:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_tasks",
    "arguments": {}
  },
  "id": 2
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"tasks\":[...],\"count\":5,\"message\":\"Found 5 tasks\"}"
      }
    ]
  },
  "id": 2
}
```

### Authentication

All requests must include one of:

- Header: `X-API-Key: tm_your_api_key`
- Header: `Authorization: Bearer tm_your_api_key`

### User Context

The MCP server infers the user's identity from the bearer token provided in the `Authorization` header. No `userEmail` argument is required in tool calls.

## Available Tools

### 1. get_tasks

**Description**: Get all tasks for the user

**Input Schema**:

```json
{}
```

**Output**:

```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "starred": "boolean",
      "order": "number",
      "date": "ISO8601 string"
    }
  ],
  "count": "number",
  "message": "string"
}
```

### 2. create_task

**Description**: Create a new task

**Input Schema**:

```json
{
  "title": "string (required)",
  "starred": "boolean (optional, default: false)"
}
```

**Output**:

```json
{
  "task": {
    "id": "string",
    "title": "string",
    "starred": "boolean",
    "order": "number",
    "date": "ISO8601 string"
  },
  "message": "string"
}
```

### 3. update_task

**Description**: Update an existing task

**Input Schema**:

```json
{
  "taskId": "string (required)",
  "title": "string (optional)",
  "starred": "boolean (optional)",
  "order": "number (optional)"
}
```

At least one of `title`, `starred`, or `order` must be provided.

**Output**: Same as create_task

### 4. delete_task

**Description**: Delete a task permanently

**Input Schema**:

```json
{
  "taskId": "string (required)"
}
```

**Output**:

```json
{
  "task": {
    "id": "string",
    "title": "string"
  },
  "message": "string"
}
```

### 5. show_tasks_widget

**Description**: Show embeddable HTML widget

**Input Schema**:

```json
{}
```

**Output**:

```json
{
  "html": "string (full HTML page)",
  "url": "string (direct URL to widget)",
  "message": "string"
}
```

## Testing

### Manual Testing with curl

1. **Test Health Endpoint**:

```bash
curl https://your-domain.com/mcp/health
```

2. **Test Initialize**:

```bash
curl -X POST https://your-domain.com/mcp/initialize \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": 1
  }'
```

3. **Test List Tools**:

```bash
curl -X POST https://your-domain.com/mcp/tools/list \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'
```

4. **Test Get Tasks**:

```bash
curl -X POST https://your-domain.com/mcp/tools/call \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_tasks",
      "arguments": {}
    },
    "id": 3
  }'
```

5. **Test Create Task**:

```bash
curl -X POST https://your-domain.com/mcp/tools/call \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "create_task",
      "arguments": {
        "title": "Test task from MCP",
        "starred": true
      }
    },
    "id": 4
  }'
```

### Testing with ChatGPT

Once your app is configured:

1. Open ChatGPT
2. Select your TaskMeow app
3. Try these commands:
   - "Show me my tasks"
   - "Add a task to buy groceries"
   - "Star the first task"
   - "Show me the task widget"
   - "Delete task 2"

## Security

### API Key Security

- API keys are prefixed with `tm_` for identification
- Keys should be at least 64 characters (32 bytes hex)
- Store keys securely in environment variables
- Never commit keys to version control
- Rotate keys periodically

### Rate Limiting

- 1000 requests per 15 minutes per IP
- Rate limit applies to all MCP endpoints
- 429 responses include retry-after headers

### Input Validation

- All tool arguments are validated
- User email is verified against database
- Task IDs are validated
- SQL injection protection (using Mongoose)

## Error Handling

MCP server returns JSON-RPC 2.0 error responses:

### Authentication Errors

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Invalid API key"
  },
  "id": null
}
```

### Invalid Parameters

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Task title is required and must be a non-empty string"
  },
  "id": 5
}
```

### Rate Limiting

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32003,
    "message": "Rate limit exceeded. Please try again later."
  },
  "id": null
}
```

## Differences from Custom GPT

| Feature          | Custom GPT (Old)           | ChatGPT App (New)     |
| ---------------- | -------------------------- | --------------------- |
| Authentication   | OAuth 2.0                  | API Key               |
| User Flow        | Browser redirect + consent | Seamless              |
| Protocol         | REST API + OpenAPI         | MCP (JSON-RPC 2.0)    |
| Setup Complexity | High (OAuth flow)          | Low (API key only)    |
| User Experience  | Auth prompt first time     | Instant access        |
| Configuration    | OpenAPI spec import        | Direct MCP connection |

## Advantages of ChatGPT Apps

1. **Simpler Setup**: No OAuth flows, redirect URIs, or consent screens
2. **Better UX**: Users don't need to authorize separately
3. **Server-to-Server**: More secure, no browser-based auth
4. **Standard Protocol**: MCP is becoming the standard for AI tool integration
5. **Easier Development**: JSON-RPC is simpler than REST + OAuth

## File Structure

```
/taskmeow
├── server/
│   ├── mcp-server.js .................... MCP protocol implementation
│   ├── user-service.js .................. User lookup (added getByEmail)
│   └── app.js ........................... MCP server mounted at /mcp
├── scripts/
│   └── generate-api-key.js .............. API key generator
├── .env ................................. API key configuration
└── CHATGPT_APP.md ....................... This documentation
```

## Troubleshooting

### "Authentication required" error

- Verify `CHATGPT_APP_API_KEY` is set in `.env`
- Ensure API key is sent in headers
- Check that API key matches exactly

### "User not found" error

- Verify user email exists in TaskMeow database
- Check that email matches exactly (case-sensitive)
- Ensure user has logged in to TaskMeow at least once

### "Invalid API key" error

- API key must be in the correct format (`tm_...`)
- Regenerate key if necessary: `npm run generate-api-key`
- Update both `.env` and ChatGPT App configuration

### Rate limiting

- Default limit: 1000 requests per 15 minutes
- Wait for rate limit window to reset
- Contact support if you need higher limits

### Widget not loading

- Check that `/embed/tasks` route is accessible
- Verify build created `embed.html`
- Test widget URL directly in browser

## Support & Resources

- **Apps SDK Documentation**: https://developers.openai.com/apps-sdk
- **MCP Protocol**: https://modelcontextprotocol.io/
- **OpenAI Platform**: https://platform.openai.com/
- **GitHub Issues**: https://github.com/ydogandjiev/taskmeow/issues

## Future Enhancements

1. **Resources**: Add MCP resources for read-only task access
2. **Prompts**: Add MCP prompts for common workflows
3. **Sampling**: Add MCP sampling for AI-generated task suggestions
4. **Webhooks**: Real-time notifications when tasks change
5. **Multi-User**: Support group/team tasks via MCP
6. **Advanced Widget**: Due dates, priorities, subtasks

## Changelog

### v1.0.0 (2024)

- Initial ChatGPT App implementation with MCP server
- 5 tools: get_tasks, create_task, update_task, delete_task, show_tasks_widget
- API key authentication
- Rate limiting
- Embeddable widget support

---

**Enjoy managing your tasks with ChatGPT! 🐱✨**
