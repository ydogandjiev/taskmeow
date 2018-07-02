const mongoose = require("mongoose");

const username = process.env.SQLCONNSTR_CosmosUsername;
const password = process.env.SQLCONNSTR_CosmosPassword;

mongoose.Promise = global.Promise;

const mongoUri = `mongodb://ds018558.mlab.com:18558/taskmeow`;

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
