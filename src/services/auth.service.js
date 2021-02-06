import MockAuthService from "./mock.auth.service";
import MsalAuthService from "./msal.auth.service";
import AdalAuthService from "./adal.auth.service";
import TeamsAuthService from "./teams.auth.service";
import SSOAuthService from "./sso.auth.service";

class AuthService {
  constructor() {
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    const useV2Param = params.get("useV2");

    // Default to using V2 auth endpoints if not specified
    const useV2 =
      useV2Param === null ||
      Boolean(useV2Param) ||
      url.pathname.indexOf("/callback/v2") >= 0;

    if (params.get("useTest")) {
      this.authService = new MockAuthService();
    } else if (params.get("inTeams")) {
      this.authService = new TeamsAuthService();
    } else if (params.get("inTeamsSSO")) {
      this.authService = new SSOAuthService();
    } else if (useV2) {
      this.authService = new MsalAuthService();
    } else {
      this.authService = new AdalAuthService();
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
