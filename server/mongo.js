const mongoose = require("mongoose");

const username = process.env.SQLCONNSTR_CosmosUsername;
const password = process.env.SQLCONNSTR_CosmosPassword;
const port = process.env.SQLCONNSTR_CosmosPort;

mongoose.Promise = global.Promise;

const mongoUri = `mongodb://${username}.documents.azure.com:${port}/?ssl=true`;

function connect() {
  return mongoose
    .connect(mongoUri, {
      auth: {
        user: username,
        password: password
      },
      config: {
        autoIndex: false
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
