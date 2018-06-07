const fetch = require("node-fetch");
const request = require("request");
const authService = require("./auth-service");

function getGraphToken(tid, token, useV2) {
  return useV2
    ? authService.exchangeForTokenV2(tid, token, [
        "https://graph.microsoft.com/user.read"
      ])
    : authService.exchangeForTokenV1(tid, token, "https://graph.microsoft.com");
}

function getImage(req, res) {
  getGraphToken(req.authInfo.tid, req.token, req.query.useV2 === "true")
    .then(token => {
      request(
        "https://graph.microsoft.com/v1.0/me/photo/$value",
        {
          headers: { Authorization: `Bearer ${token}` },
          encoding: null
        },
        (error, response, body) => {
          if (error) {
            console.error(error);
            res.status(500).send(error);
          } else {
            res.contentType("image/jpeg");
            res.end(body);
          }
        }
      );
    })
    .catch(error => {
      console.error(error);
      res.status(500).send(error);
    });
}

module.exports = {
  getImage
};
