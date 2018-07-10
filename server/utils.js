const randomNumber = require("random-number-csprng");

// How many digits the verification code should be
const verificationCodeLength = 6;

// How long the verification code is valid
const verificationCodeValidityInMilliseconds = 10 * 60 * 1000; // 10 minutes

// Regexp to look for verification code in message
const verificationCodeRegExp = /\b\d{6}\b/;

// Gets the OAuth state for the given provider
function getOAuthState(session) {
  ensureProviderData(session);
  return session.userData["AzureADv1"].oauthState;
}

// Sets the OAuth state for the given provider
function setOAuthState(session, state) {
  ensureProviderData(session);
  const data = session.userData["AzureADv1"];
  data.oauthState = state;
  session.save().sendBatch();
}

// Ensure that data bag for the given provider exists
function ensureProviderData(session) {
  if (!session.userData["AzureADv1"]) {
    session.userData["AzureADv1"] = {};
  }
}

// Gets the validated user token for the given provider
function getUserToken(session) {
  const token = getUserTokenUnsafe(session);
  return token && token.verificationCodeValidated ? token : null;
}

// Checks if the user has a token that is pending verification
function isUserTokenPendingVerification(session) {
  const token = getUserTokenUnsafe(session);
  return !!(
    token &&
    !token.verificationCodeValidated &&
    token.verificationCode
  );
}

// Sets the user token for the given provider
function setUserToken(session, token) {
  ensureProviderData(session);
  const data = session.userData["AzureADv1"];
  data.userToken = token;
  session.save().sendBatch();
}

// Prepares a token for verification. The token is marked as unverified, and a new verification code is generated.
async function prepareTokenForVerification(userToken) {
  userToken.verificationCodeValidated = false;
  userToken.verificationCode = await generateVerificationCode();
  userToken.verificationCodeExpirationTime =
    Date.now() + verificationCodeValidityInMilliseconds;
}

// Finds a verification code in the text string
function findVerificationCode(text) {
  let match = verificationCodeRegExp.exec(text);
  return match && match[0];
}

// Validates the received verification code against what is expected
// If they match, the token is marked as validated and can be used by the bot. Otherwise, the token is removed.
function validateVerificationCode(session, verificationCode) {
  let tokenUnsafe = getUserTokenUnsafe(session);
  if (!tokenUnsafe.verificationCodeValidated) {
    if (
      verificationCode &&
      tokenUnsafe.verificationCode === verificationCode &&
      tokenUnsafe.verificationCodeExpirationTime > Date.now()
    ) {
      tokenUnsafe.verificationCodeValidated = true;
      setUserToken(session, tokenUnsafe);
    } else {
      console.warn("Verification code does not match.");

      // Clear out the token after the first failed attempt to validate
      // to avoid brute-forcing the verification code
      setUserToken(session, null);
    }
  } else {
    console.warn("Received unexpected login callback.");
  }
}

// Generate a verification code that the user has to enter to verify that the person that
// went through the authorization flow is the same one as the user in the chat.
async function generateVerificationCode() {
  let verificationCode = await randomNumber(
    0,
    Math.pow(10, verificationCodeLength) - 1
  );
  return ("0".repeat(verificationCodeLength) + verificationCode).substr(
    -verificationCodeLength
  );
}

// Gets the user token for the given provider, even if it has not yet been validated
function getUserTokenUnsafe(session) {
  ensureProviderData(session);
  return session.userData["AzureADv1"].userToken;
}

// Get locale from client info in event
function getLocale(event) {
  if (event.entities && event.entities.length) {
    let clientInfo = event.entities.find(
      e => e.type && e.type === "clientInfo"
    );
    return clientInfo.locale;
  }
  return null;
}

// Load a Session corresponding to the given event
function loadSessionAsync(bot, event) {
  return new Promise((resolve, reject) => {
    bot.loadSession(event.address, (err, session) => {
      if (err) {
        winston.error("Failed to load session", {
          error: err,
          address: event.address
        });
        reject(err);
      } else if (!session) {
        winston.error("Loaded null session", { address: event.address });
        reject(new Error("Failed to load session"));
      } else {
        let locale = getLocale(event);
        if (locale) {
          session._locale = locale;
          session.localizer.load(locale, err2 => {
            // Log errors but resolve session anyway
            if (err2) {
              winston.error(`Failed to load localizer for ${locale}`, err2);
            }
            resolve(session);
          });
        } else {
          resolve(session);
        }
      }
    });
  });
}

module.exports = {
  getOAuthState,
  setOAuthState,
  getUserToken,
  isUserTokenPendingVerification,
  setUserToken,
  prepareTokenForVerification,
  findVerificationCode,
  validateVerificationCode,
  loadSessionAsync
};
