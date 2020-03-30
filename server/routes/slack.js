const express = require("express");
const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const { createMessageAdapter } = require("@slack/interactive-messages");

const router = express.Router();

if (
  process.env.APPSETTING_SLACK_BotToken &&
  process.env.APPSETTING_SLACK_SigningSecret
) {
  const web = new WebClient(process.env.APPSETTING_SLACK_BotToken);
  const slackEvents = createEventAdapter(
    process.env.APPSETTING_SLACK_SigningSecret
  );
  const slackInteractions = createMessageAdapter(
    process.env.APPSETTING_SLACK_SigningSecret
  );

  let todos = [
    { title: "To do 1", id: "to_do_1" },
    { title: "To do 2", id: "to_do_2" },
    { title: "To do 3", id: "to_do_3" }
  ];

  // Configure slack routes
  router.use("/slack/events", slackEvents.requestListener());
  router.use("/slack/actions", slackInteractions.requestListener());

  slackEvents.on("app_home_opened", event => {
    web.views.publish({ user_id: event.user, view: getHomeView() });
  });

  slackInteractions.action({ type: "button" }, payload => {
    if (payload && payload.actions && payload.actions.length) {
      for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === payload.actions[0].value) {
          todos.splice(i, 1);
          web.views.publish({ user_id: payload.user.id, view: getHomeView() });
          break;
        }
      }
    }

    return { text: "Done..." };
  });
}

function getHomeView() {
  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "Meowcome to a world of getting things done!\n\n *Here are your todos:*"
      }
    },
    {
      type: "divider"
    }
  ];

  todos.forEach(todo => {
    blocks = blocks.concat({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${todo.title}*`
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Complete",
          emoji: true
        },
        value: todo.id
      }
    });
  });

  blocks = blocks.concat({
    type: "divider"
  });

  return {
    type: "home",
    title: {
      type: "plain_text",
      text: "Keep notes!"
    },
    blocks: blocks
  };
}

module.exports = router;
