import * as msal from "@azure/msal-browser";

import MsalAuthService from "./msal.auth.service";

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

  authService = new MsalAuthService();
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
  const mockAuthResponse = {
    account: {
      name: "John Doe",
    },
  };
  mockMsalFns.handleRedirectPromise.mockResolvedValue(mockAuthResponse);

  authService.isCallback().then((isCallback) => {
    expect(isCallback).toEqual(true);
    expect(mockMsalFns.handleRedirectPromise).toHaveBeenCalledTimes(1);
    expect(mockMsalFns.setActiveAccount).toHaveBeenCalledWith(
      mockAuthResponse.account
    );
    done();
  });
});

it("can initiate login", (done) => {
  const mockAuthResponse = {
    account: {
      name: "John Doe",
    },
  };
  mockMsalFns.loginPopup.mockResolvedValue(mockAuthResponse);

  authService.login().then((account) => {
    expect(account).toEqual(mockAuthResponse.account);
    expect(mockMsalFns.loginPopup).toHaveBeenCalledTimes(1);
    expect(mockMsalFns.setActiveAccount).toHaveBeenCalledWith(
      mockAuthResponse.account
    );
    done();
  });
});

it("can initiate logout", () => {
  authService.logout();
  expect(mockMsalFns.logout).toHaveBeenCalledTimes(1);
});

it("can get token", (done) => {
  const mockAuthResponse = {
    accessToken: "fakeToken",
  };
  mockMsalFns.acquireTokenSilent.mockResolvedValue(mockAuthResponse);

  authService.getToken().then((token) => {
    expect(mockMsalFns.acquireTokenSilent).toHaveBeenCalledTimes(1);
    expect(token).toEqual(mockAuthResponse.accessToken);
    done();
  });
});

it("can get user", (done) => {
  const mockAccount = {
    name: "fakeFirst fakeLast",
    oid: "fakeOid",
  };
  mockMsalFns.getActiveAccount.mockResolvedValue(mockAccount);

  authService.getUser().then((user) => {
    expect(mockMsalFns.getActiveAccount).toHaveBeenCalledTimes(1);
    expect(user).toEqual(mockAccount);
    done();
  });
});
