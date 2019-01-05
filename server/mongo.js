const mongoose = require("mongoose");

const uri = process.env.SQLCONNSTR_DbUri;
const username = process.env.SQLCONNSTR_DbUsername;
const password = process.env.SQLCONNSTR_DbPassword;

mongoose.Promise = global.Promise;

function connect() {
  return mongoose
    .connect(
      uri,
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
      console.log(`Successfully connected to ${uri}`);
    })
    .catch(err => {
      console.error(err);
    });
}

module.exports = {
  connect,
  mongoose
};
