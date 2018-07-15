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
    return taskService.get(request.user._id);
  },
  createTask: (args, request) => {
    const userId = request.user._id;
    return taskService.create(userId, args.title, args.order, args.starred);
  },
  updateTask: (args, request) => {
    return taskService.update(args.id, args.title, args.order, args.starred);
  },
  deleteTask: (args, request) => {
    return taskService.remove(args.id);
  },
  me: (args, request) => {
    return {
      _id: request.user._id,
      email: request.user.email,
      firstname: request.user.firstname,
      lastname: request.user.lastname
    };
  }
};

router.use(
  "*",
  graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true
  })
);

module.exports = router;
