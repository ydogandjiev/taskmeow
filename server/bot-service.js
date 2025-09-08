// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
  ConfigurationServiceClientCredentialFactory,
  MemoryStorage,
} from "botbuilder";

import {
  ActionPlanner,
  ApplicationBuilder,
  OpenAIModel,
  PromptManager,
  TeamsAdapter,
} from "@microsoft/teams-ai";

import path from "path";
import { fileURLToPath } from "url";

import groupService from "./group-service.js";
import taskService from "./task-service.js";
import userService from "./user-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new TeamsAdapter(
  {},
  new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.APPSETTING_AAD_ApplicationId,
    MicrosoftAppPassword: process.env.APPSETTING_AAD_ApplicationSecret,
    MicrosoftAppType: "MultiTenant",
  })
);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights.
  console.error(`\n [onTurnError] unhandled error: ${error.toString()}`);
  console.log(error);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    "OnTurnError Trace",
    `${error.toString()}`,
    "https://www.botframework.com/schemas/error",
    "TurnError"
  );

  // Send a message to the user
  await context.sendActivity("The bot encountered an error or bug.");
  await context.sendActivity(
    "To continue to run this bot, please fix the bot source code."
  );
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

if (
  !process.env.APPSETTING_OPENAI_KEY &&
  !process.env.APPSETTING_AZURE_OPENAI_KEY
) {
  throw new Error(
    "Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT is set."
  );
}

// Create AI components
const model = new OpenAIModel({
  // OpenAI Support
  // apiKey: process.env.APPSETTING_OPENAI_KEY,
  // defaultModel: "gpt-4o",

  // Azure OpenAI Support
  azureApiKey: process.env.APPSETTING_AZURE_OPENAI_KEY,
  azureDefaultDeployment: "gpt-4o",
  azureEndpoint: process.env.APPSETTING_AZURE_OPENAI_ENDPOINT,
  azureApiVersion: "2024-08-01-preview",

  // Request logging
  logRequests: true,
});

const prompts = new PromptManager({
  promptsFolder: path.join(__dirname, "prompts"),
});

// Define a prompt function for getting the current list of tasks
prompts.addFunction("getTasks", async (context) => {
  const user = await userService.getUser(context.activity.from.aadObjectId);
  return await taskService.getForUser(user._id);
});

const planner = new ActionPlanner({
  model,
  prompts,
  defaultPrompt: "default",
});

// Define storage and application
const storage = new MemoryStorage();
const app = new ApplicationBuilder()
  .withStorage(storage)
  .withAIOptions({ planner })
  .withAuthentication(adapter, {
    settings: {
      graph: {
        scopes: ["User.Read"],
        msalConfig: {
          auth: {
            clientId: process.env.APPSETTING_AAD_ApplicationId,
            clientSecret: process.env.APPSETTING_AAD_ApplicationSecret,
            authority: "https://login.microsoftonline.com/common",
          },
        },
        signInLink: `${process.env.APPSETTING_AAD_BaseUri}/bot/start`,
        endOnInvalidMessage: true,
      },
    },
  })
  .build();

app.ai.action("addItems", async (context, state, parameters) => {
  for (const item of parameters.items) {
    const user = await userService.getUser(context.activity.from.aadObjectId);
    await taskService.createForUser(user._id, item);
  }
  return `items added. think about your next action`;
});

app.ai.action("removeItems", async (context, state, parameters) => {
  const user = await userService.getUser(context.activity.from.aadObjectId);
  const tasks = await taskService.getForUser(user._id);
  for (const item of parameters.items) {
    const task = tasks.find((task) => task.title === item);
    await taskService.removeForUser(user._id, task._id);
  }
  return `items removed. think about your next action`;
});

app.ai.action("renameItem", async (context, state, parameters) => {
  const user = await userService.getUser(context.activity.from.aadObjectId);
  const tasks = await taskService.getForUser(user._id);
  const task = tasks.find((task) => task.title === parameters.oldName);
  await taskService.updateForUser(
    user._id,
    task._id,
    parameters.newName,
    task.order,
    task.starred
  );
  return `items renamed. think about your next action`;
});

app.ai.action("starItems", async (context, state, parameters) => {
  const user = await userService.getUser(context.activity.from.aadObjectId);
  const tasks = await taskService.getForUser(user._id);
  for (const item of parameters.items) {
    const task = tasks.find((task) => task.title === item);
    task.starred = true;
    await taskService.updateForUser(
      user._id,
      task._id,
      task.title,
      task.order,
      task.starred
    );
  }
  return `items starred. think about your next action`;
});

app.message("/reset", async (context, state) => {
  state.deleteConversationState();
  await context.sendActivity(`Ok I've deleted the current conversation state.`);
});

app.message("/signout", async (context, state) => {
  await app.authentication.signOutUser(context, state);

  // Echo back users request
  await context.sendActivity(`You have signed out`);
});

// Listen for new members to join the conversation
app.conversationUpdate("membersAdded", async (context) => {
  const membersAdded = context.activity.membersAdded || [];
  for (let i = 0; i < membersAdded.length; i++) {
    // See if the member added was our bot
    if (membersAdded[i].id === context.activity.recipient.id) {
      const threadId =
        context.activity.conversation.conversationType === "channel"
          ? context.activity.channelData.team.id
          : context.activity.conversation.id;
      groupService.create(threadId, context.serviceUrl);

      await context.sendActivity("Meowcome to a world of getting things done!");
    }
  }
});

function getMembers(serviceUrl, threadId) {
  const conversationReference = {
    // bot: { id: process.env.APPSETTING_AAD_ApplicationId },
    conversation: { id: threadId },
    serviceUrl,
  };
  return app
    .getPagedMembers(conversationReference)
    .then((result) => result.members);
}

export default {
  adapter,
  app,
  getMembers,
};
