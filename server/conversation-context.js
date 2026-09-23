export function getSharedThreadId(activity) {
  const teamId = activity.channelData?.team?.id;
  if (teamId) {
    return teamId;
  }

  return activity.conversation?.conversationType === "groupChat"
    ? activity.conversation.id
    : undefined;
}
