const request = require("request-promise");
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
      return request("https://graph.microsoft.com/v1.0/me/photo/$value", {
        headers: { Authorization: `Bearer ${token}` },
        encoding: null
      }).then(img => {
        res.contentType("image/jpeg");
        res.end(img);
      });
    })
    .catch(error => {
      console.error(error);
      res.status(500).send(error);
    });
}

const graphProfileUrl = "https://graph.microsoft.com/v1.0/me";
async function getProfile(accessToken) {
  const options = {
    url: graphProfileUrl,
    json: true,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  };
  return await request.get(options);
}

module.exports = {
  getImage,
  getProfile
};
