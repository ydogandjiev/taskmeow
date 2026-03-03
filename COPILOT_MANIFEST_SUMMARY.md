# Microsoft Copilot Plugin Manifest - Summary

## Files Created

### 1. `ai-plugin.json` (Plugin Manifest v2.1)

**Location**: Root directory
**URL**: `https://taskmeow.ngrok.io/ai-plugin.json`
**Status**: ✅ Valid and accessible

**Key Features**:

- Schema version: v2.1 (latest)
- Namespace: TaskMeow
- Functions: Inferred from OpenAPI spec (simplified approach)
- Authentication: API Key via Plugin Vault
- Conversation starters: 4 examples

**Structure**:

```json
{
  "schema_version": "v2.1",
  "name_for_human": "TaskMeow",
  "namespace": "TaskMeow",
  "description_for_human": "...",
  "description_for_model": "...",
  "logo_url": "...",
  "contact_email": "...",
  "legal_info_url": "...",
  "privacy_policy_url": "...",
  "runtimes": [{
    "type": "OpenApi",
    "auth": {
      "type": "ApiKeyPluginVault",
      "reference_id": "TASKMEOW_API_KEY"
    },
    "spec": {
      "url": "https://taskmeow.ngrok.io/openapi.json"
    }
  }],
  "capabilities": {
    "conversation_starters": [...]
  }
}
```

### 2. `server/copilot-openapi.json` (OpenAPI Spec)

**Location**: Server directory
**URL**: `https://taskmeow.ngrok.io/openapi.json`
**Status**: ✅ Valid and accessible

**Key Features**:

- OpenAPI version: 3.0.0
- Single endpoint: POST /mcp/tools/call
- Operation ID: callMCPTool
- 5 examples for all MCP tools
- API Key security scheme

**Operation**: `callMCPTool`

- Calls the MCP server via JSON-RPC 2.0
- Supports 5 tools: get_tasks, create_task, update_task, delete_task, show_tasks_widget
- Examples provided for each tool

## Design Approach

### Simplified Function Inference

Instead of defining functions explicitly in the manifest, we let Microsoft Copilot **infer functions from the OpenAPI specification**. This approach:

✅ **Simpler**: Less duplication between manifest and OpenAPI spec
✅ **Less error-prone**: Single source of truth (OpenAPI spec)
✅ **Easier to maintain**: Update OpenAPI spec only
✅ **Schema compliant**: Follows v2.1 schema recommendations

From the schema:

> "If the `functions` property isn't present and there's an OpenAPI runtime, the functions are inferred from the OpenAPI operations."

### How Functions Are Inferred

Copilot will:

1. Fetch the OpenAPI spec from `https://taskmeow.ngrok.io/openapi.json`
2. Read the operation `callMCPTool`
3. Parse the examples to understand the 5 available tools
4. Generate function descriptions from the examples
5. Make them available for Copilot to call

### MCP Protocol Integration

The plugin uses the existing **MCP (Model Context Protocol)** server:

- Endpoint: `POST /mcp/tools/call`
- Protocol: JSON-RPC 2.0
- Authentication: API Key header (`X-API-Key`)

**All requests** go through the single MCP endpoint, specifying which tool to call in the request body:

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

## Configuration Steps

### 1. Microsoft 365 Admin Center

1. Go to **Settings** > **Integrated apps** > **Copilot** > **Manage plugins**
2. Click **Add a plugin** > **API Plugin**
3. Enter manifest URL: `https://taskmeow.ngrok.io/ai-plugin.json`
4. Configure authentication:
   - Type: **API Key**
   - Reference ID: `TASKMEOW_API_KEY`
   - API Key: `tm_8f3e7a2b9d4c1e6f5a8b7c9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2`
5. Assign to users/groups
6. Enable and save

### 2. Test in Copilot

Try these conversation starters:

- "Show me my TaskMeow tasks"
- "Add a task to buy groceries to my TaskMeow list"
- "Star my first TaskMeow task"
- "Delete the last task from TaskMeow"

## Available Tools (via MCP)

All tools are called through the `callMCPTool` operation:

### 1. get_tasks

**Arguments**: _(none — user inferred from bearer token)_

**Returns**: Array of tasks with id, title, starred, order, date

### 2. create_task

**Arguments**:

- `title` (required): Task title
- `starred` (optional): Mark as important

**Returns**: Created task object

### 3. update_task

**Arguments**:

- `taskId` (required): Task ID
- `title` (optional): New title
- `starred` (optional): New starred status
- `order` (optional): New order

**Returns**: Updated task object

### 4. delete_task

**Arguments**:

- `taskId` (required): Task ID

**Returns**: Deleted task confirmation

### 5. show_tasks_widget

**Arguments**: _(none — user inferred from bearer token)_

**Returns**: HTML widget and URL

## Validation

Both files validated successfully:

```bash
✓ ai-plugin.json is valid JSON
✓ copilot-openapi.json is valid JSON
✓ Endpoints are accessible
✓ Schema version is v2.1
✓ Namespace is defined
✓ Runtime configuration is correct
```

## Comparison: Before vs After

### Before (Incorrect)

- ❌ Functions defined in manifest with full schemas
- ❌ Complex state configurations
- ❌ Duplicate function definitions
- ❌ Mismatch with OpenAPI operationIds
- ❌ Over-engineered for the use case

### After (Correct)

- ✅ Functions inferred from OpenAPI
- ✅ Single source of truth
- ✅ Minimal manifest (only required fields)
- ✅ Proper schema v2.1 compliance
- ✅ Simple and maintainable

## Key Differences from ChatGPT App

| Aspect              | ChatGPT App        | Copilot Plugin            |
| ------------------- | ------------------ | ------------------------- |
| **Manifest**        | Not required       | Required (ai-plugin.json) |
| **Discovery**       | Manual URL entry   | Admin Center catalog      |
| **Auth Config**     | Direct in platform | Plugin Vault reference    |
| **User Assignment** | Per-user auth      | Admin-controlled          |
| **Function Def**    | Direct MCP tools   | Inferred from OpenAPI     |

**Both use the same MCP server!** The plugin just adds a discovery and configuration layer on top.

## Production Deployment

For production, update these URLs:

### In `ai-plugin.json`:

```json
{
  "logo_url": "https://your-domain.com/favicon.png",
  "legal_info_url": "https://your-domain.com/termsofuse",
  "privacy_policy_url": "https://your-domain.com/privacypolicy",
  "runtimes": [
    {
      "spec": {
        "url": "https://your-domain.com/openapi.json"
      }
    }
  ]
}
```

### In `server/copilot-openapi.json`:

```json
{
  "servers": [
    {
      "url": "https://your-domain.com/mcp"
    }
  ]
}
```

Then update the plugin in Admin Center with the new manifest URL.

## Troubleshooting

### Manifest not loading?

- Verify `https://taskmeow.ngrok.io/ai-plugin.json` is accessible
- Check JSON is valid with `jq`
- Ensure HTTPS (HTTP won't work)

### Authentication errors?

- Verify Reference ID is `TASKMEOW_API_KEY`
- Check API key matches .env value
- Ensure Plugin Vault configuration is saved

### Functions not appearing?

- Check OpenAPI spec is accessible
- Verify examples are properly formatted
- Ensure operation has security scheme

### Tool calls failing?

- Check MCP server is running
- Test with curl directly
- Verify database connection
- See `MCP_TEST_RESULTS.md`

## Resources

- **Schema**: https://developer.microsoft.com/json-schemas/copilot/plugin/v2.1/schema.json
- **Docs**: `COPILOT_INTEGRATION.md`
- **Quick Start**: `COPILOT_QUICKSTART.md`
- **MCP Server**: `CHATGPT_APP.md`
- **Test Results**: `MCP_TEST_RESULTS.md`

---

**Status**: ✅ Ready for Microsoft 365 Copilot
**Schema Version**: v2.1 (compliant)
**Validation**: Passed
**Endpoints**: Accessible
**MCP Server**: Working

🎉 **Corrected and ready to use!**
