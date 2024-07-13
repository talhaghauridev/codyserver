class ErrorHandler extends Error {
  constructor(message = "Somethig went wrong", statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorHandler;
