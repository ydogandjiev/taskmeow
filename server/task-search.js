import { getSharedThreadId } from "./conversation-context.js";
import utils, { baseUrl } from "./utils.js";

export async function handleTaskSearchQuery(
  activity,
  { getUser, getGroup, getMembers, getForUser, getForGroup }
) {
  const aadObjectId = activity.from?.aadObjectId;
  const message = (text) => ({
    composeExtension: { type: "message", text },
  });
  if (!aadObjectId) {
    return message("Sign in to Teams to search your tasks.");
  }

  const threadId = getSharedThreadId(activity);
  let tasks;
  if (threadId) {
    const group = await getGroup(threadId);
    if (group) {
      let members;
      try {
        members = await getMembers(group.serviceUrl, threadId);
      } catch (error) {
        if (error.code === "BotNotInConversationRoster") {
          return message(
            "Please install Task Meow in this channel or group chat before using the messaging extension."
          );
        }
        throw error;
      }
      if (!members?.some((member) => member.objectId === aadObjectId)) {
        return message(
          "You must be a member of this conversation to search its tasks."
        );
      }
      tasks = await getForGroup(group._id);
    } else {
      tasks = [];
    }
  } else {
    const user = await getUser(aadObjectId);
    if (!user) {
      return message("Sign in to Taskmeow to search your personal tasks.");
    }
    tasks = await getForUser(user._id);
  }

  const search = activity.value?.parameters?.find(
    (parameter) => parameter.name === "searchQuery"
  )?.value;
  const searchText =
    typeof search === "string" ? search.trim().toLowerCase() : "";
  const { skip = 0, count = 25 } = activity.value?.queryOptions || {};
  const attachments = tasks
    .filter((task) => task.title?.toLowerCase().includes(searchText))
    .slice(skip, skip + count)
    .map((task) => {
      const link = new URL(threadId ? "/group" : "/", baseUrl);
      link.searchParams.set("task", task._id.toString());
      if (threadId) {
        link.searchParams.set("threadId", threadId);
      }
      return utils.getTaskCardWithPreview(task, link.toString());
    });

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments,
    },
  };
}
