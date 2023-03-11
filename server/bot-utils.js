const baseUrl = "https://taskmeow.com";
const defaultContentUrl = `${baseUrl}/group/?inTeamsSSO=true`;
const defaultWebsiteUrl = `${baseUrl}/group`;
const defaultImageUrl = `${baseUrl}/static/media/logo.28c3e78f.svg`;

const createTaskBotPrompt = {
  task: {
    type: "continue",
    value: {
      card: {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          version: "1.0.0",
          type: "AdaptiveCard",
          body: [
            {
              type: "TextBlock",
              size: "Medium",
              weight: "Bolder",
              text: "Create a task",
            },
            { type: "TextBlock", text: "Title" },
            { id: "title", placeholder: "New Task", type: "Input.Text" },
          ],
          actions: [
            {
              type: "Action.Submit",
              title: "Create",
              data: {
                submitLocation: "messagingExtensionFetchTask",
              },
            },
          ],
        },
      },
      heigth: 500,
      width: 400,
      title: "Create a Task",
    },
  },
};

const signOutBotResponse = {
  task: {
    type: "continue",
    value: {
      card: {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          version: "1.0.0",
          type: "AdaptiveCard",
          body: [
            {
              type: "TextBlock",
              text: "You have been signed out.",
            },
          ],
          actions: [
            {
              type: "Action.Submit",
              title: "Close",
              data: {
                key: "close",
              },
            },
          ],
        },
      },
      heigth: 200,
      width: 400,
      title: "Adaptive Card: Inputs",
    },
  },
};

const SSOResponse = {
  composeExtension: {
    type: "silentAuth",
    responseType: "composeExtension",
    suggestedActions: {},
  },
};

const defaultAdaptiveCardAttachment = {
  contentType: "application/vnd.microsoft.card.adaptive",
  content: {
    type: "AdaptiveCard",
    version: "1.0",
    body: [
      {
        type: "TextBlock",
        size: "Medium",
        weight: "Bolder",
        text: "Tasks",
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                spacing: "None",
                text: "Created today",
                isSubtle: true,
                wrap: true,
              },
            ],
            width: "stretch",
          },
        ],
      },
      {
        type: "TextBlock",
        text: "Description",
        wrap: true,
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Outside Teams",
        url: defaultWebsiteUrl,
      },
      {
        type: "Action.Submit",
        title: "View",
        data: {
          msteams: {
            type: "invoke",
            value: {
              type: "tab/tabInfoAction",
              tabInfo: {
                contentUrl: defaultContentUrl,
                websiteUrl: defaultWebsiteUrl,
                name: "Tasks",
                entityId: "entityId",
              },
            },
          },
        },
      },
    ],
  },
  preview: {
    content: {
      title: "Description",
      text: "Task",
      images: [
        {
          url: defaultImageUrl,
        },
      ],
    },
    contentType: "application/vnd.microsoft.card.thumbnail",
  },
};

function getTaskCardWithPreview(task, groupPath) {
  return {
    contentType: "application/vnd.microsoft.card.adaptive",
    content: {
      $schema: "https://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.5",
      body: [
        {
          type: "TextBlock",
          size: "Medium",
          weight: "Bolder",
          text: task?.title || "Unknown",
        },
        {
          type: "TextBlock",
          text: "Description",
          wrap: true,
        },
        {
          type: "ActionSet",
          actions: [
            {
              type: "Action.Submit",
              title: "View",
              data: {
                msteams: {
                  type: "invoke",
                  value: {
                    type: "tab/tabInfoAction",
                    tabInfo: {
                      contentUrl: `${baseUrl}${groupPath}?task=${task?.id}&inTeamsSSO=true`,
                      websiteUrl: `${baseUrl}?task=${task?.id}`,
                      name: "Tasks",
                      entityId: "entityId",
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
    preview: {
      contentType: "application/vnd.microsoft.card.thumbnail",
      content: {
        title: task?.title,
      },
    },
  };
}

function getAdaptiveCardForTask(task, shareTag, isGroup) {
  const shareParam = shareTag ? `&shareTag=${shareTag}` : "";
  const websiteUrl = `${baseUrl}?task=${task.id}${shareParam}`;
  const contentUrl = isGroup
    ? `${baseUrl}/group?task=${task.id}${shareParam}&inTeamsSSO=true`
    : `${baseUrl}?task=${task.id}${shareParam}&inTeamsSSO=true`;
  const actions = [
    {
      type: "Action.Submit",
      title: "View",
      data: {
        msteams: {
          type: "invoke",
          value: {
            type: "tab/tabInfoAction",
            tabInfo: {
              contentUrl: contentUrl,
              websiteUrl: websiteUrl,
              name: "Tasks",
              entityId: "entityId",
            },
          },
        },
      },
    },
  ];

  // Since a group task cannot be viewed outside of Teams, we will
  // only allow opening outside when it's not a group task.
  if (!isGroup) {
    actions.push({
      type: "Action.OpenUrl",
      title: "Outside Teams",
      url: websiteUrl,
    });
  }

  const adaptiveCardJson = {
    contentType: "application/vnd.microsoft.card.adaptive",
    content: {
      type: "AdaptiveCard",
      version: "1.0",
      body: [
        {
          type: "TextBlock",
          size: "Medium",
          weight: "Bolder",
          text: task?.title || "Unknown",
        },
        {
          type: "TextBlock",
          text: "Description",
          wrap: true,
        },
      ],
      actions,
    },
    preview: {
      content: {
        title: "Description",
        text: "Task",
        images: [
          {
            url: defaultImageUrl,
          },
        ],
      },
      contentType: "application/vnd.microsoft.card.thumbnail",
    },
  };
  return adaptiveCardJson;
}

module.exports = {
  baseUrl,
  signOutBotResponse,
  SSOResponse,
  createTaskBotPrompt,
  defaultAdaptiveCardAttachment,
  getAdaptiveCardForTask,
  getTaskCardWithPreview,
};
