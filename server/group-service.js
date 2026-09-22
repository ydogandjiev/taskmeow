import Group from "./group-model.js";
import { ReadPreference } from "mongodb";

function get(threadId) {
  return Group.findOne({ threadId }).read(ReadPreference.NEAREST).exec();
}

function create(threadId, serviceUrl) {
  return Group.findOneAndUpdate(
    { threadId },
    { $set: { serviceUrl } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();
}

function remove(threadId) {
  return Group.findOneAndRemove({ threadId });
}

export default {
  get,
  create,
  remove,
};
