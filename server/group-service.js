const Group = require("./group-model");
const ReadPreference = require("mongodb").ReadPreference;

require("./mongo").connect();

function get(threadId) {
  return Group.find({ threadId })
    .read(ReadPreference.NEAREST)
    .exec();
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
  remove
};
