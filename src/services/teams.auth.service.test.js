import TeamsAuthService from "./teams.auth.service";

import * as microsoftTeams from "@microsoft/teams-js";

jest.mock("@microsoft/teams-js", () => ({
  authentication: {
    getAuthToken: jest.fn(),
    getUser: jest.fn(),
    authenticate: jest.fn(),
  },
  app: {
    initialize: jest.fn(),
  },
  getContext: jest.fn(),
}));

import * as msal from "@azure/msal-browser";

let authService = null;
const mockMsalFns = {
  getActiveAccount: jest.fn(),
  handleRedirectPromise: jest.fn(),
  loginPopup: jest.fn(),
  logout: jest.fn(),
  setActiveAccount: jest.fn(),
  getAllAccounts: jest.fn(),
  acquireTokenSilent: jest.fn(),
};

afterEach(() => {
  jest.resetAllMocks();
});

beforeEach(async () => {
  jest
    .spyOn(msal.PublicClientApplication, "createPublicClientApplication")
    .mockImplementation(() => {
      return Promise.resolve(mockMsalFns);
    });
  // jest
  // .spyOn(Object, "keys")
  // .mockImplementation(() => {
  //   return {map:jest.fn()};
  // });

  authService = new TeamsAuthService();
  await authService.initializeMSAL();
});

it("can be constructed", () => {
  expect(authService).toBeDefined();
  expect(
    msal.PublicClientApplication.createPublicClientApplication.mock.instances
      .length
  ).toEqual(1);
});

it("can check for callback", (done) => {
  const app = mockMsalFns;
  const mockAuthResponse = {
    account: {
      name: "John Doe",
    },
  };
  app.handleRedirectPromise.mockResolvedValue(mockAuthResponse);

  authService.isCallback().then((isCallback) => {
    expect(isCallback).toEqual(true);
    expect(app.handleRedirectPromise).toHaveBeenCalledTimes(1);
    expect(app.setActiveAccount).toHaveBeenCalledWith(mockAuthResponse.account);
    done();
  });
});

it("can initiate login", (done) => {
  const mockAuthResponse = {
    account: {
      name: "John Doe",
    },
  };

  const app = mockMsalFns;
  app.getActiveAccount.mockResolvedValue();

  microsoftTeams.getContext.mockImplementationOnce((callback) => {
    callback({ loginHint: "fakeUser" });
  });

  microsoftTeams.authentication.authenticate.mockImplementationOnce(
    (request) => {
      request.successCallback(mockAuthResponse, {});
    }
  );

  authService.login().then((user) => {
    expect(microsoftTeams.authentication.authenticate).toHaveBeenCalledTimes(1);
    expect(app.setActiveAccount).toHaveBeenCalledWith(mockAuthResponse.account);
    expect(user).toEqual(mockAuthResponse.account);
    done();
  });
});

it("can initiate logout", () => {
  const app = mockMsalFns;
  authService.logout();
  expect(app.logout).toHaveBeenCalledTimes(1);
});

it("can get token", (done) => {
  const app = mockMsalFns;
  const mockAuthResponse = {
    accessToken: "fakeToken",
  };
  app.acquireTokenSilent.mockResolvedValue(mockAuthResponse);

  microsoftTeams.getContext.mockImplementation((callback) => {
    callback({ loginHint: "fakeUser" });
  });

  authService.getToken().then((token) => {
    expect(app.acquireTokenSilent).toHaveBeenCalledTimes(1);
    expect(token).toEqual(mockAuthResponse.accessToken);
    done();
  });
});

it("can get user", (done) => {
  const app = mockMsalFns;
  const mockAccount = {
    name: "fakeFirst fakeLast",
    oid: "fakeOid",
  };
  app.getActiveAccount.mockResolvedValue(mockAccount);

  authService.getUser().then((user) => {
    expect(app.getActiveAccount).toHaveBeenCalledTimes(1);
    expect(user).toEqual(mockAccount);
    done();
  });
});
