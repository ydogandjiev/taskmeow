# Microsoft Copilot Integration - Quick Start

Get TaskMeow working with Microsoft 365 Copilot in 5 minutes!

## What You Get

✅ Manage tasks from Microsoft 365 Copilot
✅ Natural language interactions
✅ 5 functions: get, create, update, delete, widget
✅ Confirmation dialogs for safety
✅ Conversation starters

## Prerequisites

- ✅ TaskMeow MCP server running (already done!)
- ✅ HTTPS endpoint (taskmeow.ngrok.io)
- ✅ API key configured in .env
- Microsoft 365 admin access
- Microsoft 365 Copilot license

## Quick Setup

### Step 1: Verify Endpoints

All endpoints are ready and working:

```bash
# Plugin manifest
curl https://taskmeow.ngrok.io/ai-plugin.json

# OpenAPI spec
curl https://taskmeow.ngrok.io/openapi.json

# MCP health
curl https://taskmeow.ngrok.io/mcp/health
```

### Step 2: Get API Key

Your API key is in `.env`:

```
CHATGPT_APP_API_KEY="tm_8f3e7a2b9d4c1e6f5a8b7c9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2"
```

### Step 3: Register Plugin

1. **Go to Microsoft 365 Admin Center**

   - https://admin.microsoft.com
   - **Settings** > **Integrated apps**
   - **Copilot** > **Manage plugins**

2. **Add Plugin**

   - Click **Add a plugin**
   - Select **API Plugin**
   - Enter: `https://taskmeow.ngrok.io/ai-plugin.json`

3. **Configure Auth**

   - Authentication: **API Key**
   - Reference ID: `TASKMEOW_API_KEY`
   - Store in Plugin Vault
   - API Key: `tm_8f3e7a2b9d4c1e6f5a8b7c9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2`

4. **Assign to Users**
   - Select users or groups
   - Enable plugin
   - Save

### Step 4: Test in Copilot

Open Microsoft 365 Copilot and try:

```
Show me my TaskMeow tasks
```

```
Add "Buy groceries" to my TaskMeow list
```

```
Star my first TaskMeow task
```

## Available Commands

### View Tasks

- "Show me my TaskMeow tasks"
- "What's on my to-do list?"
- "List all my tasks"

### Create Tasks

- "Add 'Buy groceries' to TaskMeow"
- "Create a task to call dentist"
- "Add an important task to prepare slides"

### Update Tasks

- "Star my first task"
- "Rename task 2 to 'Email team'"
- "Mark the groceries task as important"

### Delete Tasks

- "Delete the last task"
- "Remove 'Buy groceries'"
- "Delete task number 3"

### Widget

- "Show me a visual task list"
- "Display my tasks in a widget"

## Files Created

✅ **ai-plugin.json** - Plugin manifest (v2.1)
✅ **server/copilot-openapi.json** - OpenAPI specification
✅ **COPILOT_INTEGRATION.md** - Full documentation
✅ **COPILOT_QUICKSTART.md** - This guide

## Endpoints

- **Plugin Manifest**: `/ai-plugin.json`
- **OpenAPI Spec**: `/openapi.json`
- **MCP Server**: `/mcp/tools/call`
- **Health Check**: `/mcp/health`

## Troubleshooting

### Plugin not appearing?

- Check manifest URL is accessible
- Verify JSON is valid
- Ensure plugin is assigned to your user
- Refresh Copilot

### Authentication errors?

- Verify API key matches .env
- Check Plugin Vault configuration
- Ensure Reference ID is `TASKMEOW_API_KEY`

### Functions not working?

- Check MCP server is running
- Verify database connection
- Check server logs
- See `MCP_TEST_RESULTS.md`

## What's Different from ChatGPT App?

| Feature   | ChatGPT App         | Copilot Plugin |
| --------- | ------------------- | -------------- |
| Users     | ChatGPT Plus        | Microsoft 365  |
| Setup     | Platform.openai.com | Admin Center   |
| Auth      | Direct API key      | Plugin Vault   |
| Manifest  | Optional            | Required       |
| Discovery | Manual              | Centralized    |

**Both use the same MCP server!** 🎉

## Production Deployment

For production, replace `taskmeow.ngrok.io` with your production domain in:

- `ai-plugin.json` (logo_url, legal_info_url, privacy_policy_url)
- `server/copilot-openapi.json` (servers.url)

Then update the plugin in Admin Center with the new manifest URL.

## Next Steps

1. ✅ Test all 5 functions in Copilot
2. ✅ Verify confirmations work
3. ✅ Share with team members
4. ✅ Monitor usage and feedback
5. ✅ Deploy to production

## Support

- Full docs: `COPILOT_INTEGRATION.md`
- MCP server: `CHATGPT_APP.md`
- Test results: `MCP_TEST_RESULTS.md`
- Schema: https://developer.microsoft.com/json-schemas/copilot/plugin/v2.1/schema.json

---

✅ **Ready for Microsoft 365 Copilot!**

Your TaskMeow plugin is configured and ready to use.
