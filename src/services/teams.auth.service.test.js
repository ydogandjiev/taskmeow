import TeamsAuthService from "./teams.auth.service";
import AuthenticationContext from "adal-angular/lib/adal";
import * as microsoftTeams from "@microsoft/teams-js";

jest.mock("adal-angular/lib/adal");
jest.mock("@microsoft/teams-js");

let mockAuthContext = {
  config: {},
  isCallback: jest.fn(),
  logOut: jest.fn(),
  getUser: jest.fn(),
  acquireToken: jest.fn()
};

beforeEach(() => {
  AuthenticationContext.mockImplementation(() => {
    return mockAuthContext;
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

it("can be constructed", () => {
  const authService = new TeamsAuthService();
  expect(authService).toBeDefined();
});

it("can check for callback", () => {
  const authService = new TeamsAuthService();
  mockAuthContext.isCallback.mockReturnValue(true);
  expect(authService.isCallback()).toEqual(true);
  expect(mockAuthContext.isCallback).toHaveBeenCalledTimes(1);
});

it("can initiate login", done => {
  const mockToken = "fakeToken";
  const mockUser = {
    name: "fakeFirst fakeLast",
    given_name: "fakeFirst",
    oid: "fakeOid"
  };

  const authService = new TeamsAuthService();
  mockAuthContext.getUser.mockImplementationOnce(callback => {
    callback(null, { profile: mockUser }, null);
  });

  microsoftTeams.getContext.mockImplementationOnce(callback => {
    callback({ loginHint: "fakeUser" });
  });

  microsoftTeams.authentication.authenticate.mockImplementationOnce(request => {
    request.successCallback(mockToken);
  });

  authService.login().then(user => {
    expect(microsoftTeams.authentication.authenticate).toHaveBeenCalledTimes(1);
    expect(mockAuthContext.getUser).toHaveBeenCalledTimes(1);
    expect(user).toEqual(mockUser);
    done();
  });
});

it("can initiate logout", () => {
  const authService = new TeamsAuthService();
  authService.logout();
  expect(mockAuthContext.logOut).toHaveBeenCalledTimes(1);
});

it("can get token", done => {
  const mockToken = "fakeToken";
  const authService = new TeamsAuthService();
  mockAuthContext.acquireToken.mockImplementationOnce((resource, callback) => {
    callback(null, mockToken, null);
  });

  microsoftTeams.getContext.mockImplementation(callback => {
    callback({ loginHint: "fakeUser" });
  });

  authService.login();
  authService.getToken().then(token => {
    expect(mockAuthContext.acquireToken).toHaveBeenCalledTimes(1);
    expect(microsoftTeams.getContext).toHaveBeenCalledTimes(2);
    expect(token).toEqual(mockToken);
    done();
  });
});

it("can get user", done => {
  const mockUser = {
    name: "fakeFirst fakeLast",
    given_name: "fakeFirst",
    oid: "fakeOid"
  };

  const authService = new TeamsAuthService();
  mockAuthContext.getUser.mockImplementationOnce(callback => {
    callback(null, { profile: mockUser }, null);
  });

  authService.getUser().then(user => {
    expect(mockAuthContext.getUser).toHaveBeenCalledTimes(1);
    expect(user).toEqual(mockUser);
    done();
  });
});
