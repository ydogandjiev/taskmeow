const graphqlHTTP = require("express-graphql");
const { buildSchema } = require("graphql");
const express = require("express");
const router = express.Router();

const taskService = require("../task-service");
const userService = require("../user-service");

const schema = buildSchema(`
  type Query {
    info: String!
    tasks: [Task!]!
  }

  type Mutation {
    createTask(title: String!, order: Float!, starred: Boolean!): Task!
    updateTask(id: ID!, title: String, order: Float, starred: Boolean): Task
    deleteTask(id: ID!): Task
  }

  type Task {
    id: ID!
    title: String!
    completed: Boolean
    starred: Boolean
    order: Float
  }
`);

const resolvers = {
  info: (args, request) => {
    const name = request.user && request.user.firstname;
    return `Hello ${name || "World"}`;
  },
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
