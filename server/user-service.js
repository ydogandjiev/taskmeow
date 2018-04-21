const fetch = require("node-fetch");
const request = require("request");
const authService = require("./auth-service");

function getGraphToken(tid, token, aadOnly) {
  return aadOnly
    ? authService.exchangeForTokenV1(tid, token, "https://graph.microsoft.com")
    : authService.exchangeForTokenV2(tid, token, [
        "https://graph.microsoft.com/user.read"
      ]);
}

function get(req, res) {
  getGraphToken(req.authInfo.tid, req.token, req.query.aadOnly === "true")
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
