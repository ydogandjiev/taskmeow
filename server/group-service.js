const Group = require("./group-model");
const ReadPreference = require("mongodb").ReadPreference;

function get(threadId) {
  return Group.findOne({ threadId }).read(ReadPreference.NEAREST).exec();
}

function create(threadId, serviceUrl) {
  return new Group({ threadId, serviceUrl }).save();
}

function remove(threadId) {
  return Group.findOneAndRemove({ threadId });
}

module.exports = {
  get,
  create,
  remove,
};
