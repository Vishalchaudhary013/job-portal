export const errorHandler = (error, req, res, next) => {
  if (error.code === 11000) {
    res.status(409).json({ message: "Duplicate value conflict." });
    return;
  }

  if (error.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      res
        .status(400)
        .json({ message: "Uploaded file is too large." });
      return;
    }
    res.status(400).json({ message: error.message });
    return;
  }

  if (error.statusCode) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error.name === "ValidationError") {
    res
      .status(400)
      .json({ message: "Validation failed.", error: error.message });
    return;
  }

  if (error.name === "CastError") {
    res.status(400).json({ message: "Invalid resource id." });
    return;
  }

  if (error.message === "Only PDF resume uploads are allowed.") {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error.message === "This file type is not supported. Please upload a PDF or DOCX file.") {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error.message === "Only PDF brochure uploads are allowed.") {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error.message === "Only JPG, PNG, or WEBP logo files are allowed.") {
    res.status(400).json({ message: error.message });
    return;
  }

  console.error("Unhandled server error:", error);
  res.status(500).json({ message: "Internal server error." });
};

export default errorHandler;
