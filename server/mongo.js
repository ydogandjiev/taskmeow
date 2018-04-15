const mongoose = require("mongoose");

const username = process.env.SQLCONNSTR_CosmosUsername || require("./environment/environment").user;
const password = process.env.SQLCONNSTR_CosmosPassword || require("./environment/environment").password;
const port = process.env.SQLCONNSTR_CosmosPort || require("./environment/environment").port;

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
