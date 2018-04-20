import * as Msal from "msal";

class AuthService {
  constructor() {
    let redirectUri = window.location.origin;

    this.applicationConfig = {
      clientID: "ab93102c-869b-4d34-a921-a31d3e7f76ef"
    };

    this.app = new Msal.UserAgentApplication(
      this.applicationConfig.clientID,
      "",
      () => {
        // callback for login redirect
      },
      {
        redirectUri
      }
    );
  }

  login = () => {
    return this.app
      .loginPopup([this.applicationConfig.clientID])
      .then(idToken => {
        return this.app.getUser();
      })
      .catch(error => {
        console.error(error);
        return null;
      });
  };

  logout = () => {
    this.app.logout();
  };

  getToken = () => {
    return this.app
      .acquireTokenSilent([this.applicationConfig.clientID])
      .catch(error => {
        return this.app
          .acquireTokenPopup([this.applicationConfig.clientID])
          .then(accessToken => {
            return accessToken;
          })
          .catch(error => {
            console.error(error);
          });
      });
  };

  fetch = (url, options) => {
    return this.getToken().then(token => {
      options = options || {};
      options.headers = options.headers || {};
      options.headers.Authorization = `Bearer ${token}`;
      return fetch(url, options);
    });
  };
}

export default new AuthService();
