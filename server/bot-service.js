const builder = require("botbuilder");
const msteams = require("botbuilder-teams");

const authDialog = require("./dialogs/auth-dialog");
const authService = require("./auth-service");
const taskService = require("./task-service");
const userService = require("./user-service");
const groupService = require("./group-service");
const utils = require("./utils");

class AuthBot extends builder.UniversalBot {
  constructor(_connector, botSettings) {
    super(_connector, botSettings);

    // Persist conversationData
    this.set("persistConversationData", true);

    // Handle generic invokes
    _connector.onInvoke(async (event, cb) => {
      try {
        await this.onInvoke(event, cb);
      } catch (e) {
        console.error("Invoke handler failed", e);
        cb(e, null, 500);
      }
    });

    _connector.onSigninStateVerification(async (event, query, cb) => {
      try {
        await this.onInvoke(event, cb);
      } catch (e) {
        console.error("Signin state verification handler failed", e);
        cb(e, null, 500);
      }
    });

    // Register dialog
    authDialog.register(this);

    // Bind handlers to ensure this pointer is accurate when they are called
    this.handleOAuthCallback = this.handleOAuthCallback.bind(this);
    this.onInvoke = this.onInvoke.bind(this);
  }

  // Handle OAuth callbacks
  async handleOAuthCallback(req, res) {
    const stateString = req.query.state;
    const state = JSON.parse(stateString);
    const authCode = req.query.code;
    let verificationCode = "";

    // Load the session from the address information in the OAuth state.
    // We'll later validate the state to check that it was not forged.
    let session;
    let address;
    try {
      address = state.address;
      session = await utils.loadSessionAsync(this, {
        type: "invoke",
        agent: "botbuilder",
        source: address.channelId,
        sourceEvent: {},
        address: address,
        user: address.user,
      });
    } catch (e) {
      console.warn("Failed to get address from OAuth state", e);
    }

    if (
      session &&
      utils.getOAuthState(session) === stateString && // OAuth state matches what we expect
      authCode
    ) {
      // User granted authorization
      try {
        // Redeem the authorization code for an access token, and store it provisionally
        // The bot will refuse to use the token until we validate that the user in the chat
        // is the same as the user who went through the authorization flow, using a verification code
        // that needs to be presented by the user in the chat.
        let userToken = await authService.getAccessTokenAsync(authCode);
        await utils.prepareTokenForVerification(userToken);
        utils.setUserToken(session, userToken);

        verificationCode = userToken.verificationCode;
      } catch (e) {
        console.error("Failed to redeem code for an access token", e);
      }
    } else {
      console.warn(
        "State does not match expected state parameter, or user denied authorization"
      );
    }

    // Render the page shown to the user
    if (verificationCode) {
      // If we have a verification code, we were able to redeem the code successfully. Render a page
      // that calls notifySuccess() with the verification code, or instructs the user to enter it in chat.
      res.render("bot-end", {
        verificationCode: verificationCode,
      });

      // The auth flow resumes when we receive the verification code response, which can happen either:
      // 1) through notifySuccess(), which is handled in BaseIdentityDialog.handleLoginCallback()
      // 2) by user entering it in chat, which is handled in BaseIdentityDialog.onMessageReceived()
    } else {
      // Otherwise render an error page
      res.render("bot-error");
    }
  }

  // Handle incoming invoke
  async onInvoke(event, cb) {
    const session = await utils.loadSessionAsync(this, event);
    if (session) {
      // Check for link unfurling
      if (event.name === "composeExtension/queryLink") {
        await this.handleLinkUnfurl(cb, event, session);
      } else if (event.name === "composeExtension/query") {
        await this.handleQuery(cb, event, session);
      } else if (event.name === "composeExtension/fetchTask") {
        await this.handleFetchTask(cb, event, session);
      } else if (event.name === "composeExtension/submitAction") {
        await this.handleSubmitAction(cb, event);
      } else {
        // Simulate a normal message and route it, but remember the original invoke message
        const payload = event.value;
        const fakeMessage = {
          ...event,
          text: payload.command + " " + JSON.stringify(payload),
          originalInvoke: event,
        };

        session.message = fakeMessage;
        session.dispatch(session.sessionState, session.message, () => {
          session.routeToActiveDialog();
        });
      }
    } else {
      cb(null, "");
    }
  }

  async handleSubmitAction(cb, event) {
    const value = event.value;
    const data = value && value.data;
    if (
      value.commandId === "createTask" &&
      data &&
      data.title &&
      event.address
    ) {
      const result = await this.handleCreateTask(
        value.data,
        event.address,
        event.sourceEvent
      );
      if (result) {
        cb(null, result);
        return;
      }
    }
    cb(null);
  }

  async handleCreateTask(data, address, sourceEvent) {
    const response = {
      composeExtension: {
        attachmentLayout: "list",
        type: "result",
        attachments: [],
      },
    };

    const taskTitle = data.title;

    try {
      const userId = address && address.user && address.user.aadObjectId;
      // Since tasks are organized at the team level (no channel tasks), use team id for channel posts,
      // otherwise, use conversation ID.
      const threadId = getThreadId(address, sourceEvent);
      if (address.conversation.conversationType !== "personal") {
        const group = await this.findOrCreateGroup(
          threadId,
          address.serviceUrl
        );
        const members = await getMembers(group.serviceUrl, threadId);
        if (members && members.some((member) => member.objectId === userId)) {
          const task = await taskService.createForGroup(group.id, taskTitle);
          const card = utils.getAdaptiveCardForTask(task, true);
          response.composeExtension.attachments = [card];
          return response;
        } else {
          console.error(
            `There are no group members or the user is not one of them.`
          );
          return null;
        }
      } else {
        const task = await taskService.createForUser(userId, taskTitle);
        const card = utils.getAdaptiveCardForTask(task);
        response.composeExtension.attachments = [card];
        return response;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async findOrCreateGroup(threadId, serviceUrl) {
    const group = await groupService.get(threadId);
    if (group) {
      return group;
    }
    return groupService.create(threadId, serviceUrl);
  }

  // Handle fetch task
  async handleFetchTask(cb, event, session) {
    if (event.value.commandId === "SignOutCommand") {
      this.handleSignOutCommand(cb, session);
    } else if (event.value.commandId === "createTask") {
      this.handleCreateTaskCommand(cb);
    } else {
      cb(null);
    }
  }

  handleCreateTaskCommand(cb) {
    const createTaskPrompt = {
      task: {
        type: "continue",
        value: {
          card: {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              version: "1.0.0",
              type: "AdaptiveCard",
              body: [
                {
                  type: "TextBlock",
                  size: "Large",
                  weight: "Bolder",
                  text: "Create a task",
                },
                { type: "TextBlock", text: "Title" },
                { id: "title", placeholder: "New Task", type: "Input.Text" },
              ],
              actions: [
                {
                  type: "Action.Submit",
                  title: "Create",
                  data: {
                    submitLocation: "messagingExtensionFetchTask",
                  },
                },
              ],
            },
          },
          heigth: 500,
          width: 500,
          title: "Create a Task",
        },
      },
    };
    cb(null, createTaskPrompt);
  }

  handleSignOutCommand(cb, session) {
    utils.setUserToken(session, null);
    const card = {
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        version: "1.0.0",
        type: "AdaptiveCard",
        body: [
          {
            type: "TextBlock",
            size: "Large",
            weight: "Bolder",
            text: "You have been signed out.",
          },
        ],
        actions: [
          {
            type: "Action.Submit",
            title: "Close",
            data: {
              key: "close",
            },
          },
        ],
      },
    };

    const response = {
      task: {
        type: "continue",
        value: {
          card: card,
          heigth: 300,
          width: 500,
          title: "Adaptive Card: Inputs",
        },
      },
    };
    cb(null, response);
  }

  // Handle query
  async handleQuery(cb, event, session) {
    //store access token
    if (event.value.authentication) {
      this.storeToken(session, event.value.authentication);
    }

    //check if user is authenticated if not send the sign in request
    if (!utils.getUserToken(session)) {
      cb(null, utils.getSSOResponse());
      return;
    }

    const groupPath =
      event.address.conversationType == "personal" ? "" : "/group";

    const searchString =
      event.value.parameters.length > 0 && event.value.parameters[0].value;

    try {
      const tasks = await this.getTasksInContext(session, event);

      const attachments = tasks
        .filter(
          (task) =>
            task.title &&
            task.title.toLowerCase().indexOf(searchString.toLowerCase()) >= 0
        )
        .map((task) => utils.getTaskCardWithPreview(task, groupPath));

      const result = {
        attachmentLayout: "list",
        type: "result",
        attachments: attachments,
        responseType: "composeExtension",
      };

      const response = {
        composeExtension: result,
      };
      cb(null, response);
    } catch (err) {
      cb(null);
    }
  }

  async getTasksInContext(session, event) {
    const address = event.address;
    const sourceEvent = event.sourceEvent;
    if (address.conversationType !== "personal") {
      // Since tasks are organized at the team level (no channel tasks), use team id for channel posts,
      // otherwise, use conversation ID.
      const threadId = getThreadId(address, sourceEvent);
      return groupService
        .get(threadId)
        .then((group) => taskService.getForGroup(group._id));
    } else {
      return userService
        .getUser(session.message.address.user.aadObjectId)
        .then((user) => taskService.getForUser(user.id));
    }
  }

  // Handle Link Unfurl
  async handleLinkUnfurl(cb, event, session) {
    //store access token
    if (event.value.authentication) {
      this.storeToken(session, event.value.authentication);
    }

    //check if user is authenticated if not send the sign in request
    if (!utils.getUserToken(session)) {
      cb(null, utils.getSSOResponse());
      return;
    }

    const urlObj = new URL(event.value.url);
    const taskId = urlObj.searchParams.get("task");
    const shareTag = urlObj.searchParams.get("shareTag");
    if (taskId) {
      const taskObj = await taskService.get(taskId);
      if (taskObj) {
        const attachment = utils.getAdaptiveCardForTask(
          taskObj,
          true,
          shareTag
        );
        const result = {
          attachmentLayout: "list",
          type: "result",
          attachments: [attachment],
          responseType: "composeExtension",
        };
        const response = {
          composeExtension: result,
        };
        cb(null, response);
        return;
      }
    }

    const attachment = utils.getDefaultAdaptiveCard();
    const result = {
      attachmentLayout: "list",
      type: "result",
      attachments: [attachment],
      responseType: "composeExtension",
    };
    const response = {
      composeExtension: result,
    };
    cb(null, response);
  }

  storeToken(session, authentication) {
    const token = {
      verificationCodeValidated: true,
      accessToken: authentication.token,
    };
    utils.setUserToken(session, token);
  }
}

function getThreadId(address, sourceEvent) {
  const conversationType = address.conversation.conversationType;
  if (conversationType == "channel") {
    return sourceEvent.team && sourceEvent.team.id;
  } else {
    return address.conversation.id;
  }
}

// Create chat bot
const connector = new msteams.TeamsChatConnector({
  appId: process.env.APPSETTING_AAD_ApplicationId,
  appPassword: process.env.APPSETTING_AAD_ApplicationSecret,
});

const botSettings = {
  storage: new builder.MemoryBotStorage(),
};

const bot = new AuthBot(connector, botSettings);

bot.on("conversationUpdate", (msg) => {
  const members = msg.membersAdded;
  if (members) {
    // Loop through all members that were just added to the team
    for (let i = 0; i < members.length; i++) {
      // See if the member added was our bot
      if (members[i].id.includes(process.env.APPSETTING_AAD_ApplicationId)) {
        const threadId = getThreadId(msg.address, msg.sourceEvent);
        groupService.create(threadId, msg.address.serviceUrl);

        const botMessage = new builder.Message()
          .address(msg.address)
          .text("Meowcome to a world of getting things done!");

        bot.send(botMessage, (error) => {
          console.error(error);
        });
      }
    }
  }
});

function getMembers(serviceUrl, threadId) {
  return new Promise((resolve, reject) => {
    connector.fetchMembers(serviceUrl, threadId, (error, members) => {
      if (error) {
        reject(error);
      } else {
        resolve(members);
      }
    });
  });
}

module.exports = {
  connector,
  bot,
  getMembers,
};
