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
