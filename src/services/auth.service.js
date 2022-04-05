import MockAuthService from "./mock.auth.service";
import MsalAuthService from "./msal.auth.service";
import TeamsAuthService from "./teams.auth.service";
import SSOAuthService from "./sso.auth.service";

class AuthService {
  constructor() {
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);

    if (params.get("useTest") || (typeof ("jest") !== undefined)) {
      this.authService = new MockAuthService();
    } else if (params.get("inTeams")) {
      this.authService = new TeamsAuthService();
    } else if (params.get("inTeamsSSO")) {
      this.authService = new SSOAuthService();
    } else {
      this.authService = new MsalAuthService();
    }
  }

  isCallback() {
    return this.authService.isCallback();
  }

  login() {
    return this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  getToken() {
    return this.authService.getToken();
  }

  getUser() {
    return this.authService.getUser();
  }

  // Does an authenticated fetch by acquiring and appending the Bearer token for our backend
  fetch(url, options) {
    return this.getToken().then((token) => {
      options = options || {};
      options.headers = options.headers || {};
      options.headers.Authorization = `Bearer ${token}`;
      return fetch(url, options);
    });
  }
}

export default new AuthService();
