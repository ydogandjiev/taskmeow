import { Router } from "express";
import { WebClient } from "@slack/web-api";
import { createEventAdapter } from "@slack/events-api";
import { createMessageAdapter } from "@slack/interactive-messages";

const router = Router();

function getHomeView(todos) {
  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Meowcome to a world of getting things done!\n\n *Here are your todos:*",
      },
    },
    {
      type: "divider",
    },
  ];

  todos.forEach((todo) => {
    blocks = blocks.concat({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${todo.title}*`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Complete",
          emoji: true,
        },
        value: todo.id,
      },
    });
  });

  blocks = blocks.concat({
    type: "divider",
  });

  return {
    type: "home",
    title: {
      type: "plain_text",
      text: "Keep notes!",
    },
    blocks: blocks,
  };
}

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
    { title: "To do 3", id: "to_do_3" },
  ];

  // Configure slack routes
  router.use("/slack/events", slackEvents.requestListener());
  router.use("/slack/actions", slackInteractions.requestListener());
  router.get("/slack/auth/redirect", async (req) => {
    const result = await web.oauth.v2.access({
      client_id: process.env.APPSETTING_SLACK_ClientId,
      client_secret: process.env.APPSETTING_SLACK_ClientSecret,
      code: req.query.code,
    });

    // It's now a good idea to save the access token to your database
    // await db.createAppInstallation(result.team_id, result.enterprise_id, result.access_token, result.bot);
    console.log(`Auth result: ${JSON.stringify(result)}`);
  });

  slackEvents.on("app_home_opened", (event) => {
    web.views.publish({ user_id: event.user, view: getHomeView(todos) });
  });

  slackInteractions.action({ type: "button" }, (payload) => {
    if (payload && payload.actions && payload.actions.length) {
      for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === payload.actions[0].value) {
          todos.splice(i, 1);
          web.views.publish({
            user_id: payload.user.id,
            view: getHomeView(todos),
          });
          break;
        }
      }
    }

    return { text: "Done..." };
  });
}

export default router;
