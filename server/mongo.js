const mongoose = require("mongoose");

const username = process.env.SQLCONNSTR_CosmosUsername;
const password = process.env.SQLCONNSTR_CosmosPassword;

mongoose.Promise = global.Promise;

const mongoUri = `mongodb://ds018798-a0.mlab.com:18798,ds018798-a1.mlab.com:18796/taskmeow?replicaSet=rs-ds018798`;

function connect() {
  return mongoose
    .connect(
      mongoUri,
      {
        auth: {
          user: username,
          password: password
        },
        config: {
          autoIndex: false
        }
      }
    )
    .then(() => {
      console.log(`Successfully connected to ${mongoUri}`);
    })
    .catch(err => {
      console.error(err);
    });
}

module.exports = {
  connect,
  mongoose
};
