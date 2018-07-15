const builder = require("botbuilder");
const msteams = require("botbuilder-teams");
const uuidv4 = require("uuid/v4");

const authService = require("../auth-service");
const taskService = require("../task-service");
const userService = require("../user-service");
const utils = require("../utils");

class AuthDialog extends builder.IntentDialog {
  // Register the dialog with the bot
  register(bot) {
    bot.dialog("/", this);

    this.onBegin((session, args, next) => {
      this.onDialogBegin(session, args, next);
    });
    this.onDefault(session => {
      this.onMessageReceived(session);
    });
    this.matches(/ShowProfile/, session => {
      this.showUserProfile(session);
    });
    this.matches(/ShowTasks/, session => {
      this.showTasks(session);
    });
    this.matches(/SignOut/, session => {
      this.handleLogout(session);
    });
  }

  // Show the user's profile
  async showUserProfile(session) {
    let userToken = utils.getUserToken(session);
    if (userToken) {
      let profile = await userService.getProfile(userToken.accessToken);
      let profileCard = new builder.ThumbnailCard()
        .title(profile.displayName)
        .subtitle(profile.userPrincipalName).text(`
            <b>E-mail</b>: ${profile.mail}<br/>
            <b>Title</b>: ${profile.jobTitle}<br/>
            <b>Office location</b>: ${profile.officeLocation}`);
      session.send(new builder.Message().addAttachment(profileCard));
    } else {
      session.send("Please sign in to AzureAD so I can access your profile.");
    }

    await this.promptForAction(session);
  }

  // Show the user's tasks
  async showTasks(session) {
    const userToken = utils.getUserToken(session);
    if (userToken) {
      session.connector.fetchMembers(
        session.message.address.serviceUrl,
        session.message.address.conversation.id,
        async (err, result) => {
          if (err || !result || result.length === 0) {
            session.endDialog("There is some error");
          } else {
            const user = await userService.getUser(
              session.message.address.user.aadObjectId
            );
            const tasks = await taskService.get(user._id);
            const msg = new builder.Message(session).addAttachment({
              contentType: "application/vnd.microsoft.teams.card.list",
              content: {
                title: "Tasks",
                items: tasks.map(task => ({
                  type: "resultItem",
                  icon: `${process.env.APPSETTING_AAD_BaseUri}/checkmark.png`,
                  title: task.title,
                  tap: {
                    type: "openUrl",
                    value: "http://trello.com"
                  }
                }))
              }
            });
            session.send(msg);
          }
        }
      );
    } else {
      session.send("Please sign in to AzureAD so I can access your profile.");
    }

    await this.promptForAction(session);
  }

  // Show prompt of options
  async promptForAction(session) {
    if (!utils.getUserToken(session)) {
      await this.handleLogin(session);
      return;
    }

    let msg = new builder.Message(session).addAttachment(
      new builder.ThumbnailCard(session).title("Azure AD").buttons([
        builder.CardAction.messageBack(session, "{}", "Show profile")
          .text("ShowProfile")
          .displayText("Show profile"),
        builder.CardAction.messageBack(session, "{}", "Show tasks")
          .text("ShowTasks")
          .displayText("Show tasks"),
        builder.CardAction.messageBack(session, "{}", "Sign out")
          .text("SignOut")
          .displayText("Sign out")
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
      if (event.name === "signin/verifyState") {
        await this.handleLoginCallback(session);
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
  async handleLoginCallback(session) {
    let messageAsAny = session.message;
    let verificationCode = messageAsAny.originalInvoke.value.state;

    utils.validateVerificationCode(session, verificationCode);

    // End of auth flow: if the token is marked as validated, then the user is logged in
    if (utils.getUserToken(session)) {
      await this.showUserProfile(session);
    } else {
      session.send(
        "Sorry, there was an error signing in to Azure AD. Please try again."
      );
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

    await this.promptForAction(session);
  }

  // Handle user login request
  async handleLogin(session) {
    // Create the OAuth state, including a random anti-forgery state token
    let address = session.message.address;
    let state = JSON.stringify({
      securityToken: uuidv4(),
      address: {
        user: {
          id: address.user.id
        },
        conversation: {
          id: address.conversation.id
        }
      }
    });
    utils.setOAuthState(session, state);

    // Create the authorization URL
    let authUrl = this.getAuthorizationUrl(session, state);

    // Build the sign-in url
    let signinUrl = `${
      process.env.APPSETTING_AAD_BaseUri
    }/bot/start?authorizationUrl=${encodeURIComponent(authUrl)}`;

    // The fallbackUrl specifies the page to be opened on mobile, until they support automatically passing the
    // verification code via notifySuccess(). If you want to support only this protocol, then you can give the
    // URL of an error page that directs the user to sign in using the desktop app. The flow demonstrated here
    // gracefully falls back to asking the user to enter the verification code manually, so we use the same
    // signin URL as the fallback URL.
    let signinUrlWithFallback = `${signinUrl}&fallbackUrl=${encodeURIComponent(
      signinUrl
    )}`;

    // Send card with signin action
    let msg = new builder.Message(session).addAttachment(
      new builder.HeroCard(session)
        .text("Click below to sign in to Azure AD")
        .buttons([
          new builder.CardAction(session)
            .type("signin")
            .value(signinUrlWithFallback)
            .title("Sign in")
        ])
    );
    session.send(msg);

    // The auth flow resumes when we handle the identity provider's OAuth callback in AuthBot.handleOAuthCallback()
  }
}

module.exports = new AuthDialog();
