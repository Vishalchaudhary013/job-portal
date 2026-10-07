import mongoose from "mongoose";
import Template from "../models/Template.js";
import TemplateResponse from "../models/TemplateResponse.js";
import { resolveBuilderResumeForForm } from "../../controllers/builderResumeController.js";


export const getTemplates = async (req, res) => {
  try {
    const { category, search, isActive } = req.query;
    const query = {};

    if (category && category !== "all") query.category = category;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const templates = await Template.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, data: templates });
  } catch (err) {
    console.log(" GET TEMPLATES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
};


export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Template ID" });
    }

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ success: true, data: template });
  } catch (err) {
    console.log(" GET TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const createTemplate = async (req, res) => {
  try {
    const { name, description, category, icon, fields } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }

    const templateKey = `custom-${Date.now()}`;

    const template = await Template.create({
      templateKey,
      name,
      description: description || "",
      category,
      icon: icon || "FiFileText",
      fields: fields || [],
      version: 1,
      isActive: true,
      isDefault: false,
    });

    res.status(201).json({ success: true, data: template });
  } catch (err) {
    console.log("CREATE TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Error creating template" });
  }
};


export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, fields } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Template ID" });
    }

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (icon !== undefined) template.icon = icon;
    if (fields !== undefined) template.fields = fields;
    template.version += 1;

    await template.save();

    res.json({ success: true, data: template });
  } catch (err) {
    console.log("UPDATE TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};


export const toggleTemplateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Template ID" });
    }

    const template = await Template.findByIdAndUpdate(
      id,
      { isActive: !!isActive },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ success: true, data: template });
  } catch (err) {
    console.log("TOGGLE TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};


export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Template ID" });
    }

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (template.isDefault) {
      return res.status(400).json({ message: "Default templates cannot be deleted" });
    }

    await Template.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.log("DELETE TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};


/* ------------------------------------------------------------------ *
 *  Template responses — submissions to a standalone shared template  *
 *  (not attached to any opportunity). Reviewed by super admins.      *
 * ------------------------------------------------------------------ */

// Value that looks like JSON (a quoted string, object, array, number, bool) — decode it,
// otherwise leave the raw string alone. Handles clients that JSON.stringify each value.
const decodeMaybeJson = (v) => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!/^["[{]/.test(t) && !/^-?\d+(\.\d+)?$/.test(t) && !["true", "false", "null"].includes(t)) return v;
  try {
    return JSON.parse(t);
  } catch {
    return v;
  }
};

// Public: a user filling in a shared template. Accepts the body keyed by fieldId, or (from
// older clients) everything nested under a single "data" key / "data[fieldId]" keys.
export const submitTemplateResponse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Template ID" });
    }

    const template = await Template.findById(id).select("name isActive");
    if (!template) return res.status(404).json({ message: "Template not found" });
    if (!template.isActive) return res.status(403).json({ message: "This form is no longer accepting responses." });

    let data = { ...(req.body || {}) };
    delete data.formId;

    // Compat: whole payload arrived nested under one "data" key (qs bracket-parsing, or a
    // client that sent JSON.stringify(formValues)).
    if (data.data && Object.keys(data).length <= 2) {
      const inner = decodeMaybeJson(data.data);
      if (inner && typeof inner === "object" && !Array.isArray(inner)) data = { ...inner };
    }

    // Compat: flatten "data[fieldId]" style keys.
    Object.keys(data).forEach((key) => {
      const m = key.match(/^data\[(.+)\]$/);
      if (m) {
        data[m[1]] = data[key];
        delete data[key];
      }
    });

    const files = {};
    (req.files || []).forEach((file) => {
      const fieldId = file.fieldname.includes("[")
        ? file.fieldname.split("[")[1].split("]")[0]
        : file.fieldname;
      files[fieldId] = `/uploads/${file.filename}`;
      data[fieldId] = files[fieldId];
    });

    // Un-double-encode individual values.
    Object.keys(data).forEach((key) => {
      data[key] = decodeMaybeJson(data[key]);
    });

    // Resolve any "built in the Resume Builder" attachment to the real file the
    // submitting user owns (see FormComponents `resumeUpload` + formResumeHandoff).
    for (const [fieldId, value] of Object.entries(data)) {
      const builderResumeId =
        value && typeof value === "object" && !Array.isArray(value) ? value.builderResumeId : null;
      if (!builderResumeId) continue;
      // eslint-disable-next-line no-await-in-loop
      const resolved = await resolveBuilderResumeForForm(builderResumeId, req.user?._id);
      if (!resolved) {
        return res.status(400).json({
          message: "That resume couldn't be attached. Please sign in with the account that built it and try again.",
        });
      }
      data[fieldId] = resolved.fileUrl;
      files[fieldId] = resolved.fileUrl;
    }

    await TemplateResponse.create({
      templateId: id,
      templateName: template.name,
      data,
      files,
      submittedBy: req.user?._id || null,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.log("SUBMIT TEMPLATE RESPONSE ERROR:", err);
    res.status(500).json({ message: "Failed to submit response", error: err.message });
  }
};

// Super admin: list every response for one template, newest first, with the template's
// current field definitions so the client can render readable columns.
export const getTemplateResponses = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Template ID" });
    }

    const template = await Template.findById(id).select("name fields");
    if (!template) return res.status(404).json({ message: "Template not found" });

    const responses = await TemplateResponse.find({ templateId: id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        template: { _id: template._id, name: template.name, fields: template.fields || [] },
        responses,
        total: responses.length,
      },
    });
  } catch (err) {
    console.log("GET TEMPLATE RESPONSES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch responses" });
  }
};

// Super admin: response counts keyed by templateId, for the dashboard cards.
export const getTemplateResponseCounts = async (_req, res) => {
  try {
    const counts = await TemplateResponse.aggregate([
      { $group: { _id: "$templateId", count: { $sum: 1 } } },
    ]);
    const map = {};
    counts.forEach((c) => {
      map[String(c._id)] = c.count;
    });
    res.json({ success: true, data: map });
  } catch (err) {
    console.log("GET TEMPLATE RESPONSE COUNTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch response counts" });
  }
};

export const deleteTemplateResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(responseId)) {
      return res.status(400).json({ message: "Invalid response ID" });
    }
    const deleted = await TemplateResponse.findByIdAndDelete(responseId);
    if (!deleted) return res.status(404).json({ message: "Response not found" });
    res.json({ success: true });
  } catch (err) {
    console.log("DELETE TEMPLATE RESPONSE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
