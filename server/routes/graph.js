import graphqlHTTP from "express-graphql";
import { buildSchema } from "graphql";
import path from "path";
import fs from "fs";
import express from "express";
const router = express.Router();

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import taskService from "../task-service.js";

const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, "schema.graphql"), {
    encoding: "utf-8",
  })
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

export default router;
