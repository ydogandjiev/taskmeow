import MockAuthService from "./mock.auth.service";

it("can be constructed", () => {
  const authService = new MockAuthService();
  expect(authService).toBeDefined();
});

it("can check for callback", () => {
  const authService = new MockAuthService();
  expect(authService.isCallback()).toEqual(false);
});

it("can initiate login", () => {
  const authService = new MockAuthService();
  authService.login();
});

it("can initiate logout", () => {
  const authService = new MockAuthService();
  authService.logout();
});

it("can get token", done => {
  const authService = new MockAuthService();
  authService.login();
  authService.getToken().then(token => {
    expect(token).toEqual("mock.token");
    done();
  });
});

it("can't get token if not logged in", done => {
  const authService = new MockAuthService();
  authService.logout();
  authService.getToken()
    .then(() => {
      done.fail();
    })
    .catch(error => {
      expect(error).toEqual("User information is not available");
      done();
    });
});

it("can get user", done => {
  const authService = new MockAuthService();
  authService.login();
  authService.getUser().then(user => {
    expect(user).toEqual({
      name: "Mock User",
      objectId: "mock.user.id"
    });
    done();
  });
});

it("can't get user if not logged in", done => {
  const authService = new MockAuthService();
  authService.logout();
  authService.getUser()
    .then(() => {
      done.fail();
    })
    .catch(error => {
      expect(error).toEqual("User information is not available");
      done();
    });
});

it("can check for useSSO", () => {
  const authService = new MockAuthService();
  expect(authService.useSSO()).toEqual(false);
});
