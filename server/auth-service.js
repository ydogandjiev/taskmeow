import fetch from "node-fetch";
import request from "request-promise";
import { stringify } from "querystring";
import passport from "passport";
import { BearerStrategy as OIDCBearerStrategy } from "passport-azure-ad";
import User from "./user-model.js";
import ServerError from "./server-error.js";

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// For this to work with tokens acquired via the AAD v2 endpoint the identityMetadata needs to be set to:
// https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration
passport.use(
  new OIDCBearerStrategy(
    {
      identityMetadata:
        "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
      clientID: process.env.APPSETTING_AAD_ApplicationId,
      validateIssuer: false,
      passReqToCallback: false,
      loggingLevel: "warn",
    },
    (token, done) => {
      User.findOne(
        { "accounts.uid": token.oid, "accounts.provider": "aad" },
        (err, user) => {
          if (err) {
            return done(err);
          }

          if (user) {
            return done(null, user, token);
          }

          const newUser = new User();
          const account = { uid: token.oid, provider: "aad" };
          newUser.accounts.push(account);
          newUser.name = token.name;
          newUser.firstname = token.given_name;
          newUser.lastname = token.family_name;
          newUser.email = token.upn || token.preferred_username;

          newUser.save(function (err) {
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

function authenticateUser(req, res, next) {
  return passport.authenticate(
    "oauth-bearer",
    { session: false },
    (err, user) => {
      if (err) throw err;
      req.user = user;
      next();
    }
  )(req, res, next);
}

function ensureAuthenticated() {
  return passport.authenticate("oauth-bearer", { session: false });
}

// Acquires a token for the specified scopes using the v2 on-behalf-of AAD flow
// https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-v2-protocols-oauth-on-behalf-of
function exchangeForToken(tid, token, scopes) {
  return new Promise((resolve, reject) => {
    const url = `https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`;
    const params = {
      client_id: process.env.APPSETTING_AAD_ApplicationId,
      client_secret: process.env.APPSETTING_AAD_ApplicationSecret,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
      requested_token_use: "on_behalf_of",
      scope: scopes.join(" "),
    };

    fetch(url, {
      method: "POST",
      body: stringify(params),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).then((result) => {
      if (result.status !== 200) {
        result.json().then(() => {
          // TODO: Check explicitly for invalid_grant or interaction_required
          reject(new ServerError(403, "ConsentRequired"));
        });
      } else {
        result.json().then((json) => {
          resolve(json.access_token);
        });
      }
    });
  });
}

// Return the url the user should navigate to to authenticate the app
function getAuthorizationUrl(state, extraParams, tenant) {
  let params = {
    response_type: "code",
    response_mode: "query",
    client_id: process.env.APPSETTING_AAD_ApplicationId,
    prompt: "consent",
    redirect_uri: `${process.env.APPSETTING_AAD_BaseUri}/auth/azureADv1/callback`,
    resource: "https://graph.microsoft.com",
    scope: "email openid offline_access profile User.Read",
    state: state,
  };

  if (extraParams) {
    params = { ...extraParams, ...params };
  }

  // Determine the tenant endpoint to use, defaulting to "common"
  tenant = tenant || "common";

  return `https://login.microsoftonline.com/${tenant}/oauth2/authorize?${stringify(
    params
  )}`;
}

// Redeem the authorization code for an access token
async function getAccessTokenAsync(code) {
  const params = {
    grant_type: "authorization_code",
    code: code,
    client_id: process.env.APPSETTING_AAD_ApplicationId,
    client_secret: process.env.APPSETTING_AAD_ApplicationSecret,
    redirect_uri: `${process.env.APPSETTING_AAD_BaseUri}/auth/azureADv1/callback`,
    resource: "https://graph.microsoft.com",
  };

  const responseBody = await request.post({
    url: "https://login.microsoftonline.com/common/oauth2/token",
    form: params,
    json: true,
  });

  return {
    accessToken: responseBody.access_token,
    expirationTime: responseBody.expires_on * 1000,
  };
}

export default {
  initialize,
  authenticateUser,
  ensureAuthenticated,
  exchangeForToken,
  getAuthorizationUrl,
  getAccessTokenAsync,
};
