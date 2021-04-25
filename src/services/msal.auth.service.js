import * as msal from "@azure/msal-browser";

// An authentication service that uses the MSAL.js library to sign in users with
// either an AAD or MSA account. This leverages the AAD v2 endpoint.
class MsalAuthService {
  constructor() {
    this.api =
      window.location.hostname === "taskmeow.com"
        ? "api://taskmeow.com/36b1586d-b1da-45d2-9b32-899c3757b6f8/access_as_user"
        : "api://taskmeow.ngrok.io/botid-ab93102c-869b-4d34-a921-a31d3e7f76ef/access_as_user";

    this.app = new msal.PublicClientApplication({
      auth: {
        clientId:
          window.location.hostname === "taskmeow.com"
            ? "36b1586d-b1da-45d2-9b32-899c3757b6f8"
            : "ab93102c-869b-4d34-a921-a31d3e7f76ef",
        redirectUri: `${window.location.origin}/callback/v2`,
      },
    });
  }

  isCallback() {
    return this.app.handleRedirectPromise().then((authResponse) => {
      if (authResponse) {
        this.app.setActiveAccount(authResponse.account);
        return true;
      } else {
        return false;
      }
    });
  }

  login() {
    // Configure all the scopes that this app needs
    const loginScopes = [
      "openid",
      "email",
      "profile",
      "offline_access",
      this.api,
    ];

    // Add non-production scopes
    const extraScopes = ["User.Read"];
    if (window.location.hostname !== "taskmeow.com") {
      extraScopes.push("Calendars.Read");
      extraScopes.push("Calendars.ReadWrite");
    }

    const authRequest = {
      scopes: loginScopes,
      extraScopesToConsent: extraScopes,
      prompt: "select_account",
    };

    if (window.navigator.standalone) {
      return this.app.loginRedirect(authRequest);
    } else {
      return this.app.loginPopup(authRequest).then((authResponse) => {
        this.app.setActiveAccount(authResponse.account);
        return authResponse.account;
      });
    }
  }

  logout() {
    this.app.logout();
  }

  getUser() {
    let activeAccount = this.app.getActiveAccount();
    if (!activeAccount) {
      const allAccounts = this.app.getAllAccounts();
      if (allAccounts.length === 1) {
        this.app.setActiveAccount(allAccounts[0]);
        activeAccount = allAccounts[0];
      }
    }
    return Promise.resolve(activeAccount);
  }

  getToken() {
    const scopes = [this.api];
    return this.app
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

export default MsalAuthService;
