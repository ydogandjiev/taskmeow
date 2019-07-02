const request = require("request-promise");
const ReadPreference = require("mongodb").ReadPreference;
const authService = require("./auth-service");
const User = require("./user-model");

async function getUser(oid) {
  return await User.findOne({
    "accounts.uid": oid,
    "accounts.provider": "aad"
  })
    .read(ReadPreference.NEAREST)
    .exec();
}

async function getGraphToken(tid, token, useV2) {
  return useV2
    ? await authService.exchangeForTokenV2(tid, token, [
        "https://graph.microsoft.com/User.Read"
      ])
    : await authService.exchangeForTokenV1(
        tid,
        token,
        "https://graph.microsoft.com"
      );
}

async function getImage(req, res) {
  try {
    const token = await getGraphToken(
      req.authInfo.tid,
      req.token,
      req.query.useV2 === "true"
    );

    const img = await request.get(
      "https://graph.microsoft.com/v1.0/me/photo/$value",
      {
        headers: { Authorization: `Bearer ${token}` },
        encoding: null
      }
    );

    res.contentType("image/jpeg");
    res.end(img);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}

async function getProfile(accessToken) {
  return await request.get({
    url: "https://graph.microsoft.com/v1.0/me",
    json: true,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

module.exports = {
  getUser,
  getImage,
  getProfile
};
