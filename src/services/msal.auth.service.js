import * as Msal from "msal";

// An authentication service that uses the MSAL.js library to sign in users with
// either an AAD or MSA account. This leverages the AAD v2 endpoint.
class MsalAuthService {
  constructor() {
    this.api =
      window.location.hostname === "taskmeow.com"
        ? "api://taskmeow.com/botid-36b1586d-b1da-45d2-9b32-899c3757b6f8/access_as_user"
        : "api://taskmeow.ngrok.io/botid-ab93102c-869b-4d34-a921-a31d3e7f76ef/access_as_user";

    this.app = new Msal.UserAgentApplication({
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
    return this.app.isCallback(window.location.hash);
  }

  login() {
    const scopes = [this.api, "https://graph.microsoft.com/User.Read"];

    return (window.navigator.standalone
      ? this.app.loginRedirect({ scopes })
      : this.app.loginPopup({ scopes })
    ).then(() => {
      return this.getUser();
    });
  }

  logout() {
    this.app.logout();
  }

  getUser() {
    return Promise.resolve(this.app.getAccount());
  }

  getToken(url) {
    const scopes = [this.api];
    return this.app
      .acquireTokenSilent({ scopes })
      .then((authResponse) => {
        return authResponse.accessToken;
      })
      .catch((error) => {
        return this.app.acquireTokenPopup({ scopes }).then((authResponse) => {
          return authResponse.accessToken;
        });
      });
  }
}

export default MsalAuthService;
