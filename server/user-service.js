import request from "request-promise";
import { ReadPreference } from "mongodb";
import User from "./user-model.js";
import authService from "./auth-service.js";

async function getUser(oid) {
  return await User.findOne({
    "accounts.uid": oid,
    "accounts.provider": "aad",
  })
    .read(ReadPreference.NEAREST)
    .exec();
}

async function getImage(req, res) {
  try {
    const token = await authService.exchangeForToken(
      req.authInfo.tid,
      req.token,
      ["https://graph.microsoft.com/User.Read"]
    );

    const img = await request.get(
      "https://graph.microsoft.com/v1.0/me/photo/$value",
      {
        headers: { Authorization: `Bearer ${token}` },
        encoding: null,
      }
    );

    res.contentType("image/jpeg");
    res.end(img);
  } catch (error) {
    console.error(`Error getting user image: ${error}`);
    res.statusMessage = error.statusMessage || error.response.statusMessage;
    res.status(error.statusCode).send();
  }
}

async function getProfile(accessToken) {
  return await request.get({
    url: "https://graph.microsoft.com/v1.0/me",
    json: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export default {
  getUser,
  getImage,
  getProfile,
};
