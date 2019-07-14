import TeamsAuthService from "./teams.auth.service";
import AuthenticationContext from "adal-angular/lib/adal";
import * as microsoftTeams from "@microsoft/teams-js";

jest.mock("adal-angular/lib/adal");
jest.mock("@microsoft/teams-js");

afterEach(() => {
  jest.resetAllMocks();
});

it("can be constructed", () => {
  const authService = new TeamsAuthService();
  expect(authService).toBeDefined();
  expect(AuthenticationContext.mock.instances.length).toEqual(1);
});

it("can check for callback", () => {
  const authService = new TeamsAuthService();
  const authContext = AuthenticationContext.mock.instances[0];
  authContext.isCallback.mockReturnValue(true);

  expect(authService.isCallback()).toEqual(true);
  expect(authContext.isCallback).toHaveBeenCalledTimes(1);
});

it("can initiate login", done => {
  const mockToken = "fakeToken";
  const mockUser = {
    name: "fakeFirst fakeLast",
    given_name: "fakeFirst",
    oid: "fakeOid"
  };

  const authService = new TeamsAuthService();
  const authContext = AuthenticationContext.mock.instances[0];
  authContext.getUser.mockImplementationOnce(callback => {
    callback(null, { profile: mockUser }, null);
  });

  microsoftTeams.authentication.authenticate.mockImplementationOnce(request => {
    request.successCallback(mockToken);
  });

  authService.login().then(user => {
    expect(user).toEqual(mockUser);
    done();
  });

  expect(microsoftTeams.authentication.authenticate).toHaveBeenCalledTimes(1);
  expect(authContext.getUser).toHaveBeenCalledTimes(1);
});

it("can initiate logout", () => {
  const authService = new TeamsAuthService();
  const authContext = AuthenticationContext.mock.instances[0];

  authService.logout();
  expect(authContext.logOut).toHaveBeenCalledTimes(1);
});

it("can get token", done => {
  const mockToken = "fakeToken";
  const authService = new TeamsAuthService();
  const authContext = AuthenticationContext.mock.instances[0];
  authContext.acquireToken.mockImplementationOnce((resource, callback) => {
    callback(null, mockToken, null);
  });

  authService.login();
  authService.getToken().then(token => {
    expect(token).toEqual(mockToken);
    done();
  });

  expect(authContext.acquireToken).toHaveBeenCalledTimes(1);
});

it("can get user", done => {
  const mockUser = {
    name: "fakeFirst fakeLast",
    given_name: "fakeFirst",
    oid: "fakeOid"
  };

  const authService = new TeamsAuthService();
  const authContext = AuthenticationContext.mock.instances[0];
  authContext.getUser.mockImplementationOnce(callback => {
    callback(null, { profile: mockUser }, null);
  });

  authService.getUser().then(user => {
    expect(user).toEqual(mockUser);
    done();
  });

  expect(authContext.getUser).toHaveBeenCalledTimes(1);
});
