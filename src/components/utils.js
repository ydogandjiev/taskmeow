export function getBaseUrl() {
  return window.location.hostname === "taskmeow.com"
    ? "https://taskmeow.com"
    : "https://taskmeow.ngrok.io";
}

const baseUrl = getBaseUrl();
if (baseUrl === "https://taskmeow.ngrok.io") {
  console.warn("***Int Mode is for local development only!!!***");
  console.warn(
    `Base URL is set to ${baseUrl}. Messages and adaptive cards sent with this URL will not work in production.`
  );
}
