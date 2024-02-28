import * as microsoftTeams from "@microsoft/teams-js";
import * as msal from "@azure/msal-browser";

// An authentication service that uses the MSAL.js library to sign in users with
// either an AAD or MSA account. This leverages the AAD v2 endpoint.
class MsalNAAAuthService {
  constructor() {
    this.api =
      window.location.hostname === "taskmeow.com"
        ? "api://taskmeow.com/botid-36b1586d-b1da-45d2-9b32-899c3757b6f8/access_as_user"
        : "api://taskmeow.ngrok.io/botid-ab93102c-869b-4d34-a921-a31d3e7f76ef/access_as_user";
  }

  get msalConfig() {
    return {
      clientId:
        window.location.hostname === "taskmeow.com"
          ? "36b1586d-b1da-45d2-9b32-899c3757b6f8"
          : "ab93102c-869b-4d34-a921-a31d3e7f76ef",
      redirectUri: `${window.location.origin}/callback/v2`,
    };
  }

  async initializeMSAL() {
    this.app = await msal.PublicClientApplication.createPublicClientApplication(
      {
        auth: {
          ...this.msalConfig,
        },
      }
    );
  }

  async initializeMSALNAA() {
    // Initialize the Teams SDK
    await microsoftTeams.app.initialize();
    this.appNext = await msal.PublicClientNext.createPublicClientApplication({
      auth: {
        ...this.msalConfig,
        supportsNestedAppAuth: true,
      },
    });
  }

  isCallback() {
    try {
      return this.appNext.handleRedirectPromise().then((authResponse) => {
        if (authResponse) {
          this.appNext.setActiveAccount(authResponse.account);
          return true;
        } else {
          return false;
        }
      });
    } catch {
      return Promise.resolve(false);
    }
  }

  async login() {
    return new Promise((resolve) => {
      microsoftTeams.getContext((context) => {
        resolve(context);
      });
    }).then(async (context) => {
      const silentRequest = {
        scopes: ["openid", "email", "profile", "offline_access", this.api],
        extraScopesToConsent: ["User.Read"],
        loginHint: context.loginHint,
      };

      await this.appNext
        .acquireTokenPopup(silentRequest)
        .then((authResponse) => {
          this.appNext.setActiveAccount(authResponse.account);
          return authResponse.account;
        })
        .catch(() => {
          throw new Error("login failed");
        });
    });
  }

  logout() {
    this.app.logout();
  }

  getUser() {
    return new Promise((resolve) => {
      microsoftTeams.getContext((context) => {
        resolve(context);
      });
    }).then(async (context) => {
      const silentRequest = {
        scopes: ["openid", "email", "profile", "offline_access", this.api],
        extraScopesToConsent: ["User.Read"],
        loginHint: context.loginHint,
      };
      try {
        await this.appNext.ssoSilent(silentRequest);
      } catch (err) {
        console.log("ssoSilent failed");
      }
      let activeAccount = this.appNext.getActiveAccount();
      if (!activeAccount) {
        const allAccounts = this.appNext.getAllAccounts();
        if (allAccounts.length === 1) {
          this.appNext.setActiveAccount(allAccounts[0]);
          activeAccount = allAccounts[0];
        }
      }
      return Promise.resolve(activeAccount);
    });
  }

  getToken() {
    return this.getTokenWithNAA();
  }

  getTokenWithNAA() {
    if (!this.appNext) {
      throw new Error(
        "MSAL instance not initialized with NAA.\nPossible reason: app is not running in Teams"
      );
    }
    return this.getTokenWithMSALClients(true);
  }

  getTokenWithMSALClients(useMsalNext = false) {
    const scopes = [this.api];
    return (useMsalNext ? this.appNext : this.app)
      .acquireTokenSilent({ scopes })
      .then((authResponse) => authResponse.accessToken)
      .catch((error) => {
        if (error.errorMessage.indexOf("interaction_required") >= 0) {
          return this.app
            .acquireTokenPopup({ scopes })
            .then((authResponse) => authResponse.accessToken);
        } else {
          return Promise.reject(error);
        }
      });
  }
}

export default MsalNAAAuthService;
