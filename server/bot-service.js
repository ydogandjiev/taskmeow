import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  ConfigurationServiceClientCredentialFactory,
  TeamsInfo,
} from "botbuilder";

import { AzureOpenAI } from "openai";
import { App, ExpressAdapter } from "@microsoft/teams.apps";

import groupService from "./group-service.js";
import taskService from "./task-service.js";
import userService from "./user-service.js";

if (
  !process.env.APPSETTING_OPENAI_KEY &&
  !process.env.APPSETTING_AZURE_OPENAI_KEY
) {
  throw new Error(
    "Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT is set."
  );
}

// Azure OpenAI client
const openaiClient = new AzureOpenAI({
  endpoint: process.env.APPSETTING_AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.APPSETTING_AZURE_OPENAI_KEY,
  deployment: "gpt-4o",
  apiVersion: "2024-08-01-preview",
});

// Per-conversation chat history
const conversationHistories = new Map();

const SYSTEM_PROMPT = `The following is a conversation with an AI assistant.
The assistant can manage a list of tasks.

rules:
- only add items to a list that the user has asked to have added.
- if items are being added and removed from a list, call a separate action for each operation.
- use a star emoji to indicate starred items
- bold starred items`;

// Tool definitions matching the old actions.json
const tools = [
  {
    type: "function",
    function: {
      name: "addItems",
      description: "Adds one or more items to a list",
      parameters: {
        type: "object",
        properties: {
          list: { type: "string", description: "The name of the list" },
          items: {
            type: "array",
            description: "The items to add",
            items: { type: "string" },
          },
        },
        required: ["list", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "removeItems",
      description: "Removes one or more items from a list",
      parameters: {
        type: "object",
        properties: {
          list: { type: "string", description: "The name of the list" },
          items: {
            type: "array",
            description: "The items to remove",
            items: { type: "string" },
          },
        },
        required: ["list", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "renameItem",
      description: "Renames an item in a list",
      parameters: {
        type: "object",
        properties: {
          list: { type: "string", description: "The name of the list" },
          oldName: { type: "string", description: "The old name of the item" },
          newName: { type: "string", description: "The new name of the item" },
        },
        required: ["list", "oldName", "newName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "starItems",
      description:
        "Stars one or more items in a list indicating that it's important",
      parameters: {
        type: "object",
        properties: {
          list: { type: "string", description: "The name of the list" },
          items: {
            type: "array",
            description: "The items to star",
            items: { type: "string" },
          },
        },
        required: ["list", "items"],
      },
    },
  },
];

// Tool handlers keyed by function name
async function handleToolCall(name, args, aadObjectId) {
  const user = await userService.getUser(aadObjectId);
  if (!user) {
    return "error: user not found. The user must sign in to the app first before managing tasks.";
  }

  switch (name) {
    case "addItems": {
      for (const item of args.items) {
        await taskService.createForUser(user._id, item);
      }
      return "items added. think about your next action";
    }
    case "removeItems": {
      const tasks = await taskService.getForUser(user._id);
      for (const item of args.items) {
        const task = tasks.find((t) => t.title === item);
        if (task) await taskService.removeForUser(user._id, task._id);
      }
      return "items removed. think about your next action";
    }
    case "renameItem": {
      const tasks = await taskService.getForUser(user._id);
      const task = tasks.find((t) => t.title === args.oldName);
      if (task) {
        await taskService.updateForUser(
          user._id,
          task._id,
          args.newName,
          task.order,
          task.starred
        );
      }
      return "items renamed. think about your next action";
    }
    case "starItems": {
      const tasks = await taskService.getForUser(user._id);
      for (const item of args.items) {
        const task = tasks.find((t) => t.title === item);
        if (task) {
          task.starred = true;
          await taskService.updateForUser(
            user._id,
            task._id,
            task.title,
            task.order,
            task.starred
          );
        }
      }
      return "items starred. think about your next action";
    }
    default:
      return `unknown tool: ${name}`;
  }
}

async function runAI(conversationId, userText, aadObjectId) {
  // Get or create conversation history
  if (!conversationHistories.has(conversationId)) {
    conversationHistories.set(conversationId, [
      { role: "system", content: SYSTEM_PROMPT },
    ]);
  }
  const history = conversationHistories.get(conversationId);

  // Inject current tasks into context
  const user = await userService.getUser(aadObjectId);
  let taskContext;
  if (user) {
    const currentTasks = await taskService.getForUser(user._id);
    taskContext = `\nCurrent tasks:\n${JSON.stringify(currentTasks)}`;
  } else {
    taskContext = "\nCurrent tasks:\n[]";
  }

  history.push({ role: "user", content: userText });

  // Run the tool-calling loop
  let response = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      ...history.slice(0, 1),
      { role: "system", content: taskContext },
      ...history.slice(1),
    ],
    tools,
    temperature: 0.2,
    max_tokens: 1000,
  });

  let message = response.choices[0].message;

  // Auto-loop tool calls until the model produces a text response
  while (message.tool_calls && message.tool_calls.length > 0) {
    history.push(message);

    for (const toolCall of message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await handleToolCall(
        toolCall.function.name,
        args,
        aadObjectId
      );
      history.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...history.slice(0, 1),
        { role: "system", content: taskContext },
        ...history.slice(1),
      ],
      tools,
      temperature: 0.2,
      max_tokens: 1000,
    });
    message = response.choices[0].message;
  }

  history.push(message);

  // Cap history to prevent unbounded growth
  const maxHistory = 50;
  if (history.length > maxHistory) {
    const systemMsg = history[0];
    history.splice(0, history.length - maxHistory, systemMsg);
  }

  return message.content || "";
}

// CloudAdapter for getMembers (used by REST routes)
const cloudAdapter = new CloudAdapter(
  new ConfigurationBotFrameworkAuthentication(
    {},
    new ConfigurationServiceClientCredentialFactory({
      MicrosoftAppId: process.env.APPSETTING_AAD_ApplicationId,
      MicrosoftAppPassword: process.env.APPSETTING_AAD_ApplicationSecret,
      MicrosoftAppType: "MultiTenant",
    })
  )
);

function getMembers(serviceUrl, threadId) {
  return new Promise((resolve, reject) => {
    const conversationReference = {
      conversation: { id: threadId },
      serviceUrl,
      bot: { id: process.env.APPSETTING_AAD_ApplicationId },
    };

    cloudAdapter
      .continueConversationAsync(
        process.env.APPSETTING_AAD_ApplicationId,
        conversationReference,
        async (context) => {
          const members = await TeamsInfo.getMembers(context);
          resolve(members);
        }
      )
      .catch(reject);
  });
}

let teamsApp;

async function initBot(expressApp) {
  const adapter = new ExpressAdapter(expressApp);

  teamsApp = new App({
    httpServerAdapter: adapter,
    messagingEndpoint: "/bot/messages",
    clientId: process.env.APPSETTING_AAD_ApplicationId,
    clientSecret: process.env.APPSETTING_AAD_ApplicationSecret,
    oauth: {
      defaultConnectionName: "graph",
    },
  });

  // Error handling
  teamsApp.event("error", async ({ error }) => {
    console.error(`\n [onError] unhandled error:`, error);
  });

  // Reset conversation state
  teamsApp.message("/reset", async ({ activity, send }) => {
    conversationHistories.delete(activity.conversation.id);
    await send("Ok I've deleted the current conversation state.");
  });

  // Sign out
  teamsApp.message("/signout", async ({ isSignedIn, signout, send }) => {
    if (isSignedIn) {
      await signout();
    }
    await send("You have signed out");
  });

  // Welcome message on bot install
  teamsApp.on("install.add", async ({ activity, send }) => {
    const threadId = activity.channelData?.team?.id || activity.conversation.id;
    const serviceUrl = activity.serviceUrl;
    groupService.create(threadId, serviceUrl);

    await send("Meowcome to a world of getting things done!");
  });

  // Handle all messages with AI
  teamsApp.on("message", async ({ activity, send }) => {
    await send({ type: "typing" });

    const userText = activity.text || "";
    const aadObjectId = activity.from.aadObjectId;

    const reply = await runAI(activity.conversation.id, userText, aadObjectId);
    await send(reply);
  });

  await teamsApp.initialize();
}

export default {
  initBot,
  getMembers,
};
