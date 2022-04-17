const graphqlHTTP = require("express-graphql");
const { buildSchema } = require("graphql");
const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();

const taskService = require("../task-service");

const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, "schema.graphql"), { encoding: "utf-8" })
);

const resolvers = {
  tasks: (args, request) => {
    return taskService.getForUser(request.user._id);
  },
  createTask: (args, request) => {
    return taskService.createForUser(
      request.user._id,
      args.title,
      args.order,
      args.starred,
      args.conversationId
    );
  },
  updateTask: (args, request) => {
    return taskService.updateForUser(
      request.user._id,
      args.id,
      args.title,
      args.order,
      args.starred,
      args.conversationId
    );
  },
  deleteTask: (args, request) => {
    return taskService.removeForUser(request.user._id, args.id);
  },
  me: (args, request) => {
    return {
      _id: request.user._id,
      email: request.user.email,
      firstname: request.user.firstname,
      lastname: request.user.lastname,
    };
  },
};

router.use(
  "*",
  graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
  })
);

module.exports = router;
