import Group from "./group-model.js";
import { ReadPreference } from "mongodb";

function get(threadId) {
  return Group.findOne({ threadId }).read(ReadPreference.NEAREST).exec();
}

function create(threadId, serviceUrl) {
  return new Group({ threadId, serviceUrl }).save();
}

function remove(threadId) {
  return Group.findOneAndRemove({ threadId });
}

export default {
  get,
  create,
  remove,
};
