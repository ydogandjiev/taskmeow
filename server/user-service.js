const authService = require("./auth-service");

function get(req, res) {
  authService
    .exchangeForToken(req.authInfo.tid, req.token, [
      "https://graph.microsoft.com/user.read"
    ])
    .then(token => {
      console.log("Exchanged token: " + token);
      res.status(500).send();
    });
}

module.exports = {
  get
};
