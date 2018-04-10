const mongoose = require("mongoose");
const env = require("./environment/environment");

mongoose.Promise = global.Promise;

const mongoUri = `mongodb://${env.user}.documents.azure.com:${
  env.port
}/?ssl=true`;

function connect() {
  return mongoose
    .connect(mongoUri, {
      auth: {
        user: env.user,
        password: env.password
      }
    })
    .catch(err => {
      console.log(err);
    });
}

module.exports = {
  connect,
  mongoose
};
