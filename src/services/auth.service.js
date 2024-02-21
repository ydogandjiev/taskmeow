import MockAuthService from "./mock.auth.service";
import MsalAuthService from "./msal.auth.service";
import TeamsAuthService from "./teams.auth.service";
import SSOAuthService from "./sso.auth.service";
import MsalNAAAuthService from "./msal.naa.auth.service"

class AuthService {
  constructor() {
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);

    if (params.get("useTest") || typeof jest !== "undefined") {
      this.authService = new MockAuthService();
    } else if (params.get("inTeams")) {
      this.authService = new TeamsAuthService();
    } else if (params.get("inTeamsSSO")) {
      this.authService = new SSOAuthService();
    } else if (params.get("inTeamsMSAL")) {
      this.authService = new MsalNAAAuthService();
    } else {
      this.authService = new MsalAuthService();
    }
  }

  tryInitializeMSAL() {
    if (this.authService["initializeMSALNAA"]) {
      return this.authService.initializeMSALNAA();
    } 
    else if (this.authService["initializeMSAL"]) {
      return this.authService.initializeMSAL();
    }
  }

  tryInitializeMSALNAA() {
    if (this.authService["initializeMSALNAA"]) {
      return this.authService.initializeMSALNAA();
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

  getTokenWithNAA() {
    if (
      !(this.authService instanceof MsalAuthService) &&
      !(this.authService instanceof MsalNAAAuthService)
    ) {
      throw new Error("This method is only supported for MsalAuthService");
    }

    return this.authService.getTokenWithNAA();
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
