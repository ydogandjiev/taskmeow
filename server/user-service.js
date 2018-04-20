const fetch = require("node-fetch");
const request = require("request");
const authService = require("./auth-service");

function get(req, res) {
  authService
    .exchangeForToken(req.authInfo.tid, req.token, [
      "https://graph.microsoft.com/user.read"
    ])
    .then(token => {
      request("https://graph.microsoft.com/v1.0/me/photo/$value", {
        headers: { Authorization: `Bearer ${token}` }
      }).pipe(res);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send(error);
    });
}

module.exports = {
  get
};
