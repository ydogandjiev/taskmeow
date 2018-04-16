const passport = require("passport");
const OIDCBearerStrategy = require("passport-azure-ad").BearerStrategy;
const User = require("./user-model");
const ReadPreference = require("mongodb").ReadPreference;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(
  new OIDCBearerStrategy(
    {
      identityMetadata:
        "https://login.microsoftonline.com/common/.well-known/openid-configuration",
      clientID: process.env.APPSETTING_AAD_ApplicationId,
      validateIssuer: false,
      passReqToCallback: false
    },
    (token, done) => {
      User.findOne(
        { "accounts.uid": token.oid, "accounts.provider": "aad" },
        function(err, user) {
          if (err) {
            return done(err);
          }

          if (user) {
            return done(null, user, token);
          }

          const user = new User();
          const account = { uid: token.oid, provider: "aad" };
          user.accounts.push(account);
          user.firstname = token.name;
          user.lastname = token.name;
          user.email = token.upn;

          user.save(function(err) {
            if (err) {
              return done(err);
            }

            return done(null, user, token);
          });
        }
      );
    }
  )
);

function initialize(app) {
  app.use(passport.initialize());
  app.use(passport.session());
}

function ensureAuthenticated() {
  return passport.authenticate("oauth-bearer", { session: false });
}

module.exports = {
  initialize,
  ensureAuthenticated
};
