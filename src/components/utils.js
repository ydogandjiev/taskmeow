const { REACT_APP_RUN_MODE } = process.env;
const isInt = REACT_APP_RUN_MODE === "int";
export const baseUrl = isInt
  ? "https://taskmeow.ngrok.io"
  : "https://taskmeow.com";
if (isInt) {
  console.warn("***Int Mode is for local development only!!!***");
  console.warn(
    `Base URL is set to ${baseUrl}. Messages and adaptive cards sent with this URL will not work in production.`
  );
}
