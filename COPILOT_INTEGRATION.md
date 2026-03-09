# Microsoft Copilot Integration for TaskMeow

## Overview

TaskMeow integrates with Microsoft 365 Copilot as an API plugin, allowing users to manage their tasks directly from Copilot conversations.

## What is a Copilot Plugin?

A Copilot plugin extends Microsoft 365 Copilot with custom capabilities by:

- Defining functions that Copilot can call
- Providing API endpoints via OpenAPI specification
- Using authentication to access user data securely
- Offering natural language interactions

## Architecture

```
Microsoft 365 Copilot
         ↓
   Plugin Manifest (ai-plugin.json)
         ↓
   OpenAPI Spec (openapi.json)
         ↓
   MCP Server (/mcp/tools/call)
         ↓
   TaskMeow Database
```

## Files Created

### 1. Plugin Manifest: `ai-plugin.json`

**Location**: Root directory
**Purpose**: Describes the plugin to Microsoft 365 Copilot
**Schema Version**: v2.1

**Key Sections**:

- **Metadata**: Name, description, contact info, logo
- **Functions**: 5 tools (get_tasks, create_task, update_task, delete_task, show_tasks_widget)
- **Runtime**: OpenAPI configuration with API key authentication
- **Capabilities**: Conversation starters and localization

### 2. OpenAPI Specification: `server/copilot-openapi.json`

**Purpose**: Describes the API endpoints for Copilot to call
**Protocol**: JSON-RPC 2.0 over HTTP
**Endpoint**: `/mcp/tools/call`

**Authentication**: API Key via `X-API-Key` header

## Functions Available

### 1. get_tasks

**Description**: Retrieve all tasks for the user
**Parameters**: _(none — user inferred from bearer token)_

**Example Usage in Copilot**:

- "Show me my tasks"
- "What's on my TaskMeow list?"
- "List all my to-dos"

### 2. create_task

**Description**: Create a new task
**Parameters**:

- `title` (required): Task title
- `starred` (optional): Mark as important (default: false)

**Example Usage**:

- "Add 'Buy groceries' to my TaskMeow list"
- "Create a task to call the dentist"
- "Add an important task to prepare presentation"

### 3. update_task

**Description**: Update task properties
**Parameters**:

- `taskId` (required): Task identifier
- `title` (optional): New title
- `starred` (optional): New starred status
- `order` (optional): New display order

**Example Usage**:

- "Star my first task"
- "Rename task 2 to 'Call dentist'"
- "Mark the groceries task as important"

### 4. delete_task

**Description**: Delete a task permanently
**Parameters**:

- `taskId` (required): Task identifier

**Example Usage**:

- "Delete the last task"
- "Remove 'Buy groceries' from my list"
- "Delete task number 3"

**Confirmation**: Plugin requests confirmation before deletion

### 5. show_tasks_widget

**Description**: Show embeddable task widget
**Parameters**: _(none — user inferred from bearer token)_

**Example Usage**:

- "Show me a visual task list"
- "Display my tasks in a widget"
- "Give me an interactive task view"

## Setup Instructions

### Step 1: Deploy TaskMeow

Ensure your TaskMeow server is deployed and accessible via HTTPS.

**Required**:

- HTTPS endpoint (e.g., `https://taskmeow.ngrok.io`)
- MCP server running at `/mcp`
- API key configured in `.env`

### Step 2: Configure API Key

Your API key should already be in `.env`:

```bash
APPSETTING_CHATGPT_APP_API_KEY="tm_your_generated_api_key_here"
```

### Step 3: Verify Endpoints

Test that the manifest and OpenAPI spec are accessible:

```bash
# Plugin manifest
curl https://taskmeow.ngrok.io/ai-plugin.json

# OpenAPI spec
curl https://taskmeow.ngrok.io/openapi.json

# MCP health
curl https://taskmeow.ngrok.io/mcp/health
```

### Step 4: Register Plugin with Microsoft 365

1. **Go to Microsoft 365 Admin Center**

   - Navigate to **Settings** > **Integrated apps**
   - Select **Copilot** > **Manage plugins**

2. **Add Custom Plugin**

   - Click **Add a plugin**
   - Select **API Plugin**
   - Enter manifest URL: `https://taskmeow.ngrok.io/ai-plugin.json`

3. **Configure Authentication**

   - Select **API Key** authentication
   - Reference ID: `TASKMEOW_API_KEY`
   - Store API key in Plugin Vault
   - Key: `tm_your_generated_api_key_here`

4. **Assign to Users**

   - Select users or groups
   - Enable the plugin
   - Save configuration

5. **Test in Copilot**
   - Open Microsoft 365 Copilot
   - Try: "Show me my TaskMeow tasks"
   - Verify plugin is called and returns data

## Plugin Manifest Details

### Schema Version: v2.1

The manifest follows the [Microsoft Copilot Plugin Schema v2.1](https://developer.microsoft.com/json-schemas/copilot/plugin/v2.1/schema.json).

### Key Fields

**Required**:

- `schema_version`: "v2.1"
- `name_for_human`: "TaskMeow"
- `namespace`: "TaskMeow"
- `description_for_human`: Short user-facing description
- `description_for_model`: Detailed guidance for Copilot

**Optional**:

- `logo_url`: Plugin icon
- `contact_email`: Support contact
- `legal_info_url`: Terms of service
- `privacy_policy_url`: Privacy policy

### Functions

Each function includes:

- **name**: Unique identifier
- **description**: Detailed guidance for when to use
- **parameters**: JSON Schema for inputs
- **returns**: Expected response structure
- **states**: Reasoning and responding guidance
- **capabilities**: Confirmation dialogs

### Runtimes

Defines how to call the API:

```json
{
  "type": "OpenApi",
  "auth": {
    "type": "ApiKeyPluginVault",
    "reference_id": "TASKMEOW_API_KEY"
  },
  "spec": {
    "url": "https://taskmeow.ngrok.io/openapi.json"
  },
  "run_for_functions": ["get_tasks", "create_task", ...]
}
```

### Capabilities

**Conversation Starters**: Example prompts shown to users

```json
{
  "text": "Show me my TaskMeow tasks",
  "title": "View Tasks"
}
```

**Localization**: Multi-language support (currently en-US)

## OpenAPI Specification

### Endpoint: POST /mcp/tools/call

All functions call this single endpoint using JSON-RPC 2.0 protocol.

**Request Format**:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_tasks",
    "arguments": {}
  },
  "id": 1
}
```

**Response Format**:

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
  "id": 1
}
```

### Authentication

**Type**: API Key
**Header**: `X-API-Key`
**Value**: Your configured API key from `.env`

Security is managed through Microsoft's Plugin Vault, which securely stores and injects the API key.

## User Experience

### In Microsoft 365 Copilot

Users can interact with TaskMeow naturally:

**Example Conversations**:

```
User: Show me my TaskMeow tasks
Copilot: Here are your tasks:
1. ⭐ Buy groceries
2. Call dentist
3. ⭐ Prepare presentation
You have 3 tasks (2 starred).

User: Add a task to email the team
Copilot: I've created a new task: "Email the team".
Would you like to star it as important?

User: Yes, star it
Copilot: Done! The task "Email the team" is now starred ⭐

User: Delete the dentist task
Copilot: Are you sure you want to delete "Call dentist"?
This action cannot be undone.

User: Yes
Copilot: Task "Call dentist" has been deleted from your list.
```

### Confirmation Dialogs

Certain actions (create, update, delete) show confirmation dialogs with Adaptive Cards, allowing users to review before execution.

## Testing

### Manual Testing

1. **Test Plugin Manifest**:

   ```bash
   curl https://taskmeow.ngrok.io/ai-plugin.json | jq .
   ```

2. **Test OpenAPI Spec**:

   ```bash
   curl https://taskmeow.ngrok.io/openapi.json | jq .
   ```

3. **Test MCP Endpoint**:
   ```bash
   curl -X POST https://taskmeow.ngrok.io/mcp/tools/call \
     -H "X-API-Key: your_key" \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc":"2.0",
       "method":"tools/call",
       "params":{
         "name":"get_tasks",
         "arguments":{}
       },
       "id":1
     }'
   ```

### In Copilot

1. Enable the plugin in Microsoft 365 admin center
2. Open Microsoft 365 Copilot
3. Try conversation starters from the manifest
4. Test all 5 functions
5. Verify confirmations work
6. Check error handling

## Security Considerations

### API Key Security

- API keys stored in Microsoft Plugin Vault
- Keys injected by Copilot, not stored client-side
- Rotate keys periodically
- Use different keys for dev/prod

### User Data Privacy

- Each user's email identifies their tasks
- No cross-user data access
- API validates user ownership
- Follows TaskMeow privacy policy

### Rate Limiting

- MCP server has rate limiting (1000 req/15min)
- Prevents abuse
- Protects backend resources

## Troubleshooting

### Plugin Not Appearing

**Check**:

- Manifest URL is accessible via HTTPS
- JSON is valid (use jsonlint.com)
- Plugin is assigned to your user/group
- Copilot app is up to date

### Authentication Errors

**Check**:

- API key is correct in Plugin Vault
- Reference ID matches manifest (`TASKMEOW_API_KEY`)
- Key is active in `.env`
- Server is receiving `X-API-Key` header

### Function Calls Failing

**Check**:

- OpenAPI spec URL is accessible
- MCP server endpoint is working (`/mcp/tools/call`)
- Database connection is established
- User email exists in TaskMeow database
- Server logs for detailed errors

### Database Connection Issues

**Error**: `Operation 'users.findOne()' buffering timed out`

**Solution**:

- Verify MongoDB connection string in `.env`
- Check database is accessible
- Test connection manually
- See `MCP_TEST_RESULTS.md` for diagnosis

## Comparison: ChatGPT App vs Copilot Plugin

| Feature            | ChatGPT App        | Copilot Plugin      |
| ------------------ | ------------------ | ------------------- |
| **Protocol**       | MCP (JSON-RPC)     | MCP via OpenAPI     |
| **Manifest**       | Not required       | ai-plugin.json      |
| **Authentication** | API Key            | Plugin Vault        |
| **Discovery**      | Manual URL         | Admin Center        |
| **User Base**      | ChatGPT Plus users | Microsoft 365 users |
| **Integration**    | OpenAI Platform    | Microsoft 365       |

**Both use the same MCP server!** 🎉

## Future Enhancements

1. **Rich Cards**: Add Adaptive Card templates for visual task display
2. **Notifications**: Real-time updates when tasks change
3. **Group Tasks**: Support team/shared task lists
4. **Due Dates**: Add deadline tracking
5. **Priorities**: Task priority levels
6. **Categories**: Organize tasks by category
7. **Search**: Advanced task search and filtering
8. **Analytics**: Task completion statistics

## Support

- **Documentation**: This file
- **MCP Server Docs**: `CHATGPT_APP.md`
- **Test Results**: `MCP_TEST_RESULTS.md`
- **Schema**: https://developer.microsoft.com/json-schemas/copilot/plugin/v2.1/schema.json
- **GitHub Issues**: https://github.com/ydogandjiev/taskmeow/issues

## Resources

- [Microsoft Copilot Extensibility](https://learn.microsoft.com/microsoft-365-copilot/extensibility/)
- [Build Declarative Copilots](https://learn.microsoft.com/microsoft-365-copilot/extensibility/build-declarative-copilots)
- [API Plugin Documentation](https://learn.microsoft.com/microsoft-365-copilot/extensibility/overview-api-plugins)
- [Plugin Manifest Schema v2.1](https://developer.microsoft.com/json-schemas/copilot/plugin/v2.1/schema.json)

---

**Status**: ✅ Ready for Microsoft 365 Copilot Integration

**Created**: February 24, 2026
**MCP Server**: Working
**Plugin Manifest**: Complete
**OpenAPI Spec**: Complete
**Documentation**: Complete

🎉 **TaskMeow is ready for Microsoft 365 Copilot!**
