const fetch = require("node-fetch");
const querystring = require("querystring");
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

          const newUser = new User();
          const account = { uid: token.oid, provider: "aad" };
          newUser.accounts.push(account);
          newUser.firstname = token.name;
          newUser.lastname = token.name;
          newUser.email = token.upn;

          newUser.save(function(err) {
            if (err) {
              return done(err);
            }

            return done(null, newUser, token);
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

function exchangeForToken(tid, jwt, scopes = ["openid"]) {
  return new Promise((resolve, reject) => {
    const v2Params = {
      client_id: process.env.APPSETTING_AAD_ApplicationId,
      client_secret: process.env.APPSETTING_AAD_ApplicationSecret,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
      requested_token_use: "on_behalf_of",
      scope: scopes.join(" ")
    };

    fetch(`https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`, {
      method: "POST",
      body: querystring.stringify(v2Params),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }).then(result => {
      if (result.status !== 200) {
        result.json().then(json => {
          console.log(json);
          reject(json);
        });
      } else {
        result.json().then(json => {
          console.log(json.access_token);
          resolve(json.access_token);
        });
      }
    });
  });

  try {
    // TODO3: Construct the parameters that will be sent in the body of the
    //        HTTP Request to the STS that starts the "on behalf of" flow.
    // TODO4: Send the request to the STS.
    // TODO5: Catch errors from the STS and relay them to the client.
    // TODO6: Process the response and persist the access token to resource.
  } catch (exception) {
    throw new UnauthorizedError(
      "Unable to obtain an access token to the resource" +
        JSON.stringify(exception),
      exception
    );
  }
}

module.exports = {
  initialize,
  ensureAuthenticated,
  exchangeForToken
};
