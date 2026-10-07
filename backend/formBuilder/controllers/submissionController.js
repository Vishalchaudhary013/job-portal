import Submission from "../models/Submission.js";
import Form from "../models/Form.js";

export const submitForm = async (req, res) => {
  try {
    const formId = req.params.id;
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const data = {};
    const files = {};

    //  HANDLE TEXT DATA
    Object.keys(req.body).forEach((key) => {
      if (key.startsWith("data[")) {
        const fieldId = key.match(/data\[(.*?)\]/)[1];
        data[fieldId] = JSON.parse(req.body[key]);
      }
    });

    //  HANDLE FILES
    if (req.files) {
      req.files.forEach((file) => {
        const match = file.fieldname.match(/files\[(.*?)\]/);
        if (match) {
          const fieldId = match[1];
          files[fieldId] = file.path;
        }
      });
    }

    const submission = new Submission({
      formId,
      data,
      files,
    });

    await submission.save();

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      formId: req.params.id,
    });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};