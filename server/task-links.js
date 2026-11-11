import { getSharedThreadId } from "./conversation-context.js";
import utils, { baseUrl } from "./utils.js";

const emptyResult = () => ({
  composeExtension: {
    type: "result",
    attachmentLayout: "list",
    attachments: [],
  },
});

export async function handleTaskLinkQuery(
  activity,
  { getTask, getUser, getGroup, getMembers }
) {
  const rawUrl = activity.value?.url;
  if (typeof rawUrl !== "string" || !URL.canParse(rawUrl)) {
    return emptyResult();
  }

  const url = new URL(rawUrl);
  const taskId = url.searchParams.get("task");
  if (
    url.origin !== new URL(baseUrl).origin ||
    !["/", "/group", "/group/"].includes(url.pathname) ||
    !/^[a-f\d]{24}$/i.test(taskId || "") ||
    !activity.from?.aadObjectId
  ) {
    return emptyResult();
  }

  const task = await getTask(taskId);
  if (!task) {
    return emptyResult();
  }

  const shareTag = url.searchParams.get("shareTag");
  const link = new URL(task.group ? "/group" : "/", baseUrl);
  link.searchParams.set("task", taskId);

  if (task.group) {
    const sharedThreadId = getSharedThreadId(activity);
    const threadId = url.searchParams.get("threadId") || sharedThreadId;
    if (!threadId || threadId !== sharedThreadId) {
      return emptyResult();
    }
    const group = await getGroup(threadId);
    if (!group || group._id.toString() !== task.group.toString()) {
      return emptyResult();
    }
    const members = await getMembers(group.serviceUrl, threadId);
    if (
      !members?.some((member) => member.objectId === activity.from.aadObjectId)
    ) {
      return emptyResult();
    }
    link.searchParams.set("threadId", threadId);
  } else if (shareTag && task.shareTag === shareTag) {
    link.searchParams.set("shareTag", shareTag);
  } else {
    const user = await getUser(activity.from.aadObjectId);
    if (!user || task.user?.toString() !== user._id.toString()) {
      return emptyResult();
    }
  }

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [utils.getTaskCardWithPreview(task, link.toString())],
    },
  };
}
