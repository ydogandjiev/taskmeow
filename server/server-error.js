class ServerError extends Error {
  constructor(statusCode, statusMessage) {
    super(`ServerError: ${statusCode} - ${statusMessage}`);
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
  }
}

export default ServerError;
