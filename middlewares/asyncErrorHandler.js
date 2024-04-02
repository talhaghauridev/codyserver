module.exports = errorFunction => (req, res, next) => {
    Promise.resolve(errorFunction(req, res, next)).catch((error) => {
        console.error("Caught by asyncErrorHandler:", error);
        next(error);
    });
};
