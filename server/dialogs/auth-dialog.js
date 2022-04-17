const builder = require("botbuilder");
const msteams = require("botbuilder-teams");
const uuidv4 = require("uuid/v4");

const authService = require("../auth-service");
const taskService = require("../task-service");
const userService = require("../user-service");
const utils = require("../utils");

class AuthDialog extends builder.IntentDialog {
  showUserProfileAction = "showUserProfileAction";
  showTasksAction = "showTasksAction";

  // Register the dialog with the bot
  register(bot) {
    bot.dialog("/", this);

    this.onBegin((session, args, next) => {
      this.onDialogBegin(session, args, next);
    });
    this.onDefault((session) => {
      this.onMessageReceived(session);
    });
    this.matches(/ShowProfile/, (session) => {
      this.showUserProfile(session);
    });
    this.matches(/ShowTasks/, (session) => {
      this.showTasks(session);
    });
    this.matches(/SignOut/, (session) => {
      this.handleLogout(session);
    });
  }

  // Show the user's profile
  async showUserProfile(session) {
    if (!utils.getUserToken(session)) {
      await this.handleSilentLogin(session, this.showUserProfileAction);
      return;
    }

    const user = await userService.getUser(
      session.message.address.user.aadObjectId
    );
    let userCard = new builder.ThumbnailCard().title(user.firstname).text(`
          <b>Lastname</b>: ${user.lastname}<br/>
          <b>E-mail</b>: ${user.email}`);
    session.send(new builder.Message().addAttachment(userCard));

    await this.promptForAction(session);
  }

  // Show the user's tasks
  async showTasks(session) {
    if (!utils.getUserToken(session)) {
      await this.handleSilentLogin(session, this.showTasksAction);
      return;
    }

    const user = await userService.getUser(
      session.message.address.user.aadObjectId
    );
    const tasks = await taskService.getForUser(user._id);
    const msg = new builder.Message(session).addAttachment({
      contentType: "application/vnd.microsoft.teams.card.list",
      content: {
        title: "Tasks",
        items: tasks.map((task) => ({
          type: "resultItem",
          icon: `${process.env.APPSETTING_AAD_BaseUri}/checkmark.png`,
          title: task.title,
          tap: {
            type: "openUrl",
            value: "http://trello.com",
          },
        })),
      },
    });
    session.send(msg);

    await this.promptForAction(session);
  }

  // Show prompt of options
  async promptForAction(session) {
    if (!utils.getUserToken(session)) {
      await this.handleSilentLogin(session);
      return;
    }

    let msg = new builder.Message(session).addAttachment(
      new builder.ThumbnailCard(session)
        .title("Azure AD")
        .buttons([
          builder.CardAction.messageBack(session, "{}", "Show profile")
            .text("ShowProfile")
            .displayText("Show profile"),
          builder.CardAction.messageBack(session, "{}", "Show tasks")
            .text("ShowTasks")
            .displayText("Show tasks"),
          builder.CardAction.messageBack(session, "{}", "Sign out")
            .text("SignOut")
            .displayText("Sign out"),
        ])
    );
    session.send(msg);
  }

  // Get an authorization url for Azure AD
  getAuthorizationUrl(session, state) {
    // For AzureAD, we need to generate an authorization URL specific to the current tenant.
    // This is important for guest users, so we get an access token for the correct organization
    // (i.e., the current tenant, not the home tenant of the guest user).
    let tenantId = msteams.TeamsMessage.getTenantId(session.message);
    return authService.getAuthorizationUrl(state, null, tenantId);
  }

  // Handle start of dialog
  async onDialogBegin(session, args, next) {
    session.dialogData.isFirstTurn = true;
    next();
  }

  // Handle message
  async onMessageReceived(session) {
    let messageAsAny = session.message;
    if (messageAsAny.originalInvoke) {
      // This was originally an invoke message, see if it is signin/verifyState
      let event = messageAsAny.originalInvoke;
      if (event.name === "signin/tokenExchange") {
        await this.handleTokenCallback(session);
      } else {
        console.warn(`Received unrecognized invoke "${event.name}"`);
      }
    } else {
      // See if we are waiting for a verification code and got one
      if (utils.isUserTokenPendingVerification(session)) {
        let verificationCode = utils.findVerificationCode(session.message.text);
        utils.validateVerificationCode(session, verificationCode);

        // End of auth flow: if the token is marked as validated, then the user is logged in
        if (utils.getUserToken(session)) {
          await this.showUserProfile(session);
        } else {
          session.send(
            "Sorry, there was an error signing in to Azure AD. Please try again."
          );
        }
      } else {
        // Unrecognized input
        this.promptForAction(session);
      }
    }
  }

  // Handle user login callback
  async handleTokenCallback(session) {
    const messageAsAny = session.message;
    const requestId = messageAsAny.originalInvoke.value.id;
    const state = JSON.parse(utils.getOAuthState(session));

    // check if there is a pending oauth request
    if (state.securityToken == requestId) {
      const pendingAction = state.pendingAction;

      state.securityToken = state.pendingAction = undefined;
      utils.setOAuthState(session, JSON.stringify(state));
      const token = {
        verificationCodeValidated: true,
        accessToken: messageAsAny.originalInvoke.value.token,
      };
      utils.setUserToken(session, token);

      await this.executePendingAction(session, pendingAction);
    } else {
      console.warn("Received unexpected request id.");
      return;
    }
  }

  // Execute user pending action or default
  async executePendingAction(session, action) {
    if (action == this.showTasksAction) {
      await this.showTasks(session);
    } else if (action == this.showUserProfileAction) {
      await this.showUserProfile(session);
    } else {
      await this.promptForAction(session);
    }
  }

  // Handle user logout request
  async handleLogout(session) {
    if (!utils.getUserToken(session)) {
      session.send("You're already signed out of Azure AD.");
    } else {
      utils.setUserToken(session, null);
      session.send("You're now signed out of Azure AD.");
    }
  }

  // Handle user login request
  async handleSilentLogin(session, pendingAction) {
    // Create the OAuth state, including a random anti-forgery state token
    const address = session.message.address;
    const requestId = uuidv4();
    const state = JSON.stringify({
      securityToken: requestId,
      address: {
        user: {
          id: address.user.id,
        },
        conversation: {
          id: address.conversation.id,
        },
      },
      pendingAction: pendingAction,
    });
    utils.setOAuthState(session, state);

    const cardContent = JSON.parse(
      `{\"text\":\"Sign in card\",\"title\":\"Sign in card\",\"buttons\":` +
        `[],\"tokenExchangeResource\":{\"id\":\"${requestId}\"}}`
    );

    // Send card with signin action
    const msg = new builder.Message(session).addAttachment({
      contentType: "application/vnd.microsoft.card.oauth",
      content: cardContent,
    });
    session.send(msg);

    // The auth flow resumes when we either get an invoke call with the token or handle the identity provider's OAuth callback in AuthBot.handleOAuthCallback()
  }
}

module.exports = new AuthDialog();
