import * as microsoftTeams from "@microsoft/teams-js";
import * as Msal from "msal";

// An authentication service that uses the MSAL.js and Teams.js library to sign in users with
// their AAD account. This leverages the AAD v2 endpoint.
class TeamsAuthService {
  constructor() {
    // Initialize the Teams SDK
    microsoftTeams.initialize();

    this.applicationConfig = {
      clientId:
        window.location.hostname === "taskmeow.com"
          ? "36b1586d-b1da-45d2-9b32-899c3757b6f8"
          : "ab93102c-869b-4d34-a921-a31d3e7f76ef",
    };

    this.app = new Msal.UserAgentApplication(
      this.applicationConfig.clientId,
      "",
      null,
      {
        redirectUri: `${window.location.origin}/tab/silent-end`,
      }
    );
  }

  isCallback() {
    return this.app.isCallback(window.location.hash);
  }

  login() {
    if (!this.loginPromise) {
      this.loginPromise = new Promise((resolve, reject) => {
        // Start the login flow
        microsoftTeams.authentication.authenticate({
          url: `${window.location.origin}/tab/silent-start`,
          width: 600,
          height: 535,
          successCallback: () => {
            resolve(this.getUser());
          },
          failureCallback: (reason) => {
            this.loginPromise = null;
            reject(reason);
          },
        });
      });
    }
    return this.loginPromise;
  }

  logout() {
    this.authContext.logOut();
  }

  getUser() {
    return Promise.resolve(this.app.getUser());
  }

  getToken() {
    return this.app.acquireTokenSilent([this.applicationConfig.clientId]);
  }
}

export default TeamsAuthService;
