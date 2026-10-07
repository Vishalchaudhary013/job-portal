export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found." });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message, ...(error.details ? { details: error.details } : {}) });
  }
  if (error.name === "MulterError") {
    const message = error.code === "LIMIT_FILE_SIZE" ? "The file is too large." : error.message;
    return res.status(400).json({ message });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {}).pop() || "value";
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }
  if (error.name === "ValidationError") return res.status(400).json({ message: "Validation failed.", details: error.message });
  if (error.name === "CastError") return res.status(400).json({ message: "Invalid id." });
  if (error.type === "entity.too.large") return res.status(413).json({ message: "Request body is too large." });
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "Malformed JSON." });

  console.error("[form-builder] Unhandled error:", error);
  res.status(500).json({ message: "Internal server error." });
};
