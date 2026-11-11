export function buildStageViewUrl(stageContext) {
  if (!stageContext.appId) {
    throw new Error(
      "APPSETTING_AAD_ApplicationId is required to create a Stageview link"
    );
  }

  const context = encodeURIComponent(JSON.stringify(stageContext));
  return `https://teams.microsoft.com/l/stage/${encodeURIComponent(
    stageContext.appId
  )}/0?context=${context}`;
}
