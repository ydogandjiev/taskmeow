import * as Msal from "msal";

// An authentication service that uses the MSAL.js library to sign in users with
// either an AAD or MSA account. This leverages the AAD v2 endpoint.
class MsalAuthService {
  constructor() {
    this.applicationConfig = {
      clientId: "ab93102c-869b-4d34-a921-a31d3e7f76ef"
    };

    this.app = new Msal.UserAgentApplication(
      this.applicationConfig.clientId,
      "",
      null,
      {
        redirectUri: `${window.location.origin}/callback/v2`
      }
    );
  }

  isCallback() {
    return this.app.isCallback(window.location.hash);
  }

  login() {
    const scopes = [
      `api://${this.applicationConfig.clientId}/access_as_user`,
      "https://graph.microsoft.com/User.Read"
    ];

    return (window.navigator.standalone
      ? this.app.loginRedirect(scopes)
      : this.app.loginPopup(scopes)
    ).then(() => {
      return this.app.getUser();
    });
  }

  logout() {
    this.app.logout();
  }

  getUser() {
    return Promise.resolve(this.app.getUser());
  }

  getToken() {
    return this.app
      .acquireTokenSilent([this.applicationConfig.clientId])
      .catch(error => {
        return this.app
          .acquireTokenPopup([this.applicationConfig.clientId])
          .then(accessToken => {
            return accessToken;
          })
          .catch(error => {
            console.error(error);
          });
      });
  }
}

export default MsalAuthService;
