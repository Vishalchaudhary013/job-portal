import Form from "../models/Form.js";
import FormResponse from "../models/FormResponse.js";
import mongoose from "mongoose";

import Application from "../../models/applicationModel.js";
import InternshipOpportunity from "../../models/internshipOpportunityModel.js";
import GlobalProgramOpportunity from "../../models/globalProgramOpportunityModel.js";
import { resolveBuilderResumeForForm } from "../../controllers/builderResumeController.js";

// ================= CREATE FORM =================
export const createForm = async (req, res) => {
  try {
    let formData = {};

    // ✅ SAFE PARSE
    try {
      formData = req.body.formData
        ? JSON.parse(req.body.formData)
        : req.body;
    } catch (err) {
      console.log("❌ JSON PARSE ERROR:", err);
      formData = req.body;
    }

    // ✅ SAFETY
    if (!formData.formSchema) {
      formData.formSchema = { fields: [] };
    }

    const files = req.files || [];

    console.log("📦 FILES:", files);

    // ✅ FILE HANDLING
    if (files.length > 0) {
      formData.formSchema.fields = (formData.formSchema.fields || []).map(field => {

        const file = files.find(f =>
          f.fieldname === `files[${field.id}]` ||
          f.fieldname.includes(field.id)
        );

        if (!file) return field;

        console.log("✅ MATCHED FILE:", field.id, file.path);

        if (field.type === "bannerUpload") {
          return { ...field, bannerUrl: file.path };
        }

        if (field.type === "pdfUpload") {
          return { ...field, pdfUrl: file.path };
        }

        if (field.type === "carouselUpload") {
          const carouselFiles = files.filter(f =>
            f.fieldname === `files[${field.id}]` ||
            f.fieldname.includes(field.id)
          );

          // Get existing images (that already have server paths)
          const existingImages = (field.images || []).filter(img => 
            img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')
          );

          // Map new files to image objects
          const newImages = carouselFiles.map(f => ({ 
            src: f.path 
          }));

          return {
            ...field,
            images: [...existingImages, ...newImages]
          };
        }

        return field;
      });
    }

    const form = new Form({
  ...formData,
  companyName: formData.companyName || ""
});
    await form.save();

    res.status(201).json({
      success: true,
      data: form
    });

  } catch (err) {
    console.log("❌ CREATE FORM ERROR:", err);
    res.status(500).json({ message: "Error creating form" });
  }
};


// ================= UPDATE FORM =================
export const updateForm = async (req, res) => {
  try {
    let formData = {};

    // ✅ SAFE PARSE
    try {
      formData = req.body.formData
        ? JSON.parse(req.body.formData)
        : req.body;
    } catch (err) {
      console.log("❌ JSON PARSE ERROR:", err);
      formData = req.body;
    }

    // ✅ SAFETY
    if (!formData.formSchema) {
      formData.formSchema = { fields: [] };
    }

    const files = req.files || [];

    console.log("📦 UPDATE FILES:", files);

    if (files.length > 0) {
      formData.formSchema.fields = (formData.formSchema.fields || []).map(field => {

        const file = files.find(f =>
          f.fieldname === `files[${field.id}]` ||
          f.fieldname.includes(field.id)
        );

        if (!file) return field;

        console.log("✅ UPDATE MATCH:", field.id, file.path);

        if (field.type === "bannerUpload") {
          return { ...field, bannerUrl: file.path };
        }

        if (field.type === "pdfUpload") {
          return { ...field, pdfUrl: file.path };
        }

        if (field.type === "carouselUpload") {
          const carouselFiles = files.filter(f =>
            f.fieldname === `files[${field.id}]` ||
            f.fieldname.includes(field.id)
          );

          // Get existing images (that already have server paths)
          const existingImages = (field.images || []).filter(img => 
            img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')
          );

          // Map new files to image objects
          const newImages = carouselFiles.map(f => ({ 
            src: f.path 
          }));

          return {
            ...field,
            images: [...existingImages, ...newImages]
          };
        }

        return field;
      });
    }

   const updated = await Form.findByIdAndUpdate(
  req.params.id,
  {
    ...formData,
    companyName: formData.companyName || ""
  },
  { returnDocument: "after" }
);

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    console.log("❌ UPDATE ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};


// ================= GET FORM =================
export const getFormById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Form ID" });
    }

    const form = await Form.findById(id);

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);

  } catch (err) {
    console.log("❌ GET FORM ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= PUBLIC FORM =================
export const getPublicForm = async (req, res) => {
  const form = await Form.findById(req.params.id);

  if (!form || form.status !== "published") {
    return res.status(404).json({ message: "Form not found" });
  }

  res.json(form);
};


// ================= PUBLISH =================
export const publishForm = async (req, res) => {
  const form = await Form.findByIdAndUpdate(
    req.params.id,
    {
      status: "published",
      publishedUrl: `public-form/${req.params.id}`
    },
    { returnDocument: "after" }
  );

  res.json(form);
};


// ================= DELETE =================
export const deleteForm = async (req, res) => {
  await Form.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};


// ================= SUBMIT =================

export const submitForm = async (req, res) => {
  try {
    const formId = req.params.id;
    const { 
      opportunityId, 
      opportunityTitle, 
      opportunityType, 
      company 
    } = req.body;

    // ✅ Fetch Form Schema to identify field mappings
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    let data = { ...req.body };
    let filesData = {};

    // Remove metadata from data object
    delete data.opportunityId;
    delete data.opportunityTitle;
    delete data.opportunityType;
    delete data.company;
    delete data.formId;

    // ✅ Handle Files
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fieldId = file.fieldname.includes('[') 
          ? file.fieldname.split('[')[1].split(']')[0]
          : file.fieldname;

        filesData[fieldId] = {
          fileName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          previewUrl: `/uploads/${file.filename}`
        };
        data[fieldId] = filesData[fieldId].filePath;
      });
    }

    // ✅ Resolve any "built in the Resume Builder" attachment to the file the
    // submitting user owns (value arrives as a JSON string of { builderResumeId }).
    for (const key of Object.keys(data)) {
      let parsed = data[key];
      if (typeof parsed === "string" && parsed.trim().startsWith("{")) {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = null;
        }
      }
      const builderResumeId = parsed && typeof parsed === "object" ? parsed.builderResumeId : null;
      if (!builderResumeId) continue;
      // eslint-disable-next-line no-await-in-loop
      const resolved = await resolveBuilderResumeForForm(builderResumeId, req.user?._id);
      if (!resolved) {
        return res.status(400).json({
          message: "That resume couldn't be attached. Please sign in with the account that built it and try again.",
        });
      }
      data[key] = resolved.fileUrl;
      filesData[key] = {
        fileName: resolved.fileName,
        filePath: resolved.fileUrl,
        mimeType: "application/pdf",
        size: 0,
        previewUrl: resolved.fileUrl,
      };
    }

    // ✅ Map fields based on Label
    let applicantName = "Anonymous";
    let firstName = "";
    let lastName = "";
    let applicantEmail = "no-email@provided.com";
    let applicantPhone = "N/A";
    let identifiedResume = null;

    const fields = form.formSchema?.fields || [];
    fields.forEach(field => {
      const label = String(field.label || "").toLowerCase();
      const type = String(field.type || "").toLowerCase();
      const value = data[field.id];
      const file = filesData[field.id];

      // Handle standard text fields
      if (value) {
        if (label.includes("first name")) {
          firstName = value;
        } else if (label.includes("last name")) {
          lastName = value;
        } else if (label.includes("full name")) {
          applicantName = value;
        } else if (label.includes("name") || label.includes("applicant")) {
          if (applicantName === "Anonymous") applicantName = value;
        } else if (label.includes("email") || label.includes("mail") || type === "email") {
          applicantEmail = value;
        } else if (
          label.includes("phone") || 
          label.includes("mobile") || 
          label.includes("contact") || 
          label.includes("whatsapp") || 
          label.includes("number") ||
          type === "mobilewithcheckbox"
        ) {
          applicantPhone = value;
        }
      }

      // Handle file fields (Resume/CV)
      if (file) {
        if (label.includes("resume") || label.includes("cv") || label.includes("document") || label.includes("file")) {
          identifiedResume = file;
        }
      }
    });

    // Combine names if split
    if (firstName || lastName) {
      applicantName = `${firstName} ${lastName}`.trim();
    }

    // Final fallback to direct keys if label matching failed
    if (applicantName === "Anonymous") applicantName = data.name || data.fullName || data.applicantName || applicantName;
    if (applicantEmail === "no-email@provided.com") applicantEmail = data.email || data.emailAddress || applicantEmail;
    if (applicantPhone === "N/A") applicantPhone = data.phone || data.phoneNumber || data.mobile || applicantPhone;

    // If user is logged in, use their details as ultimate fallback
    if (req.user) {
      if (applicantName === "Anonymous") applicantName = req.user.fullName || applicantName;
      if (applicantEmail === "no-email@provided.com") applicantEmail = req.user.email || applicantEmail;
      if (applicantPhone === "N/A") applicantPhone = req.user.whatsappNumber || applicantPhone;
    }

    // ✅ Create FormResponse
    const formResponse = await FormResponse.create({
      formId,
      data,
      files: filesData
    });

    // ✅ Create Application
    const application = await Application.create({
      opportunity: opportunityId && mongoose.Types.ObjectId.isValid(opportunityId) ? opportunityId : null,
      opportunityTitle: opportunityTitle || "Dynamic Form Submission",
      opportunityType: opportunityType || "Internship",
      company: company || "",
      name: applicantName,
      email: applicantEmail,
      phone: applicantPhone,
      formData: data,
      formResponse: formResponse._id,
      resume: identifiedResume || filesData.resume || filesData.pdfUpload || filesData.fileUpload || Object.values(filesData)[0] || {
        fileName: "No File Uploaded",
        filePath: "",
        mimeType: "application/pdf",
        size: 0
      }
    });

    // ✅ Link to Opportunity for Response Count
    if (opportunityId && mongoose.Types.ObjectId.isValid(opportunityId)) {
      if (opportunityType === "Internship") {
        await InternshipOpportunity.findByIdAndUpdate(opportunityId, {
          $push: { submissionIds: application._id }
        });
      } else if (opportunityType === "Global Program") {
        await GlobalProgramOpportunity.findByIdAndUpdate(opportunityId, {
          $push: { submissionIds: application._id }
        });
      }
    }

    res.json({
      success: true,
      message: "Application submitted successfully",
      data: application
    });

  } catch (err) {
    console.log("❌ SUBMISSION ERROR:", err);
    res.status(500).json({ message: "Submission failed", error: err.message });
  }
};

// ================= SUBMISSIONS =================
export const getSubmissions = async (req, res) => {
  res.json([]);
};

// ================= GET RESPONSES =================
export const getFormResponses = async (req, res) => {
  try {
    const responses = await FormResponse.find({
      formId: req.params.id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: responses
    });

  } catch (err) {
    console.log("❌ GET RESPONSES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch responses" });
  }
};

export const getInternshipResponsesSummary = async (req, res) => {
  try {
    const result = await FormResponse.aggregate([
      {
        $group: {
          _id: "$formId",
          totalResponses: { $sum: 1 }
        }
      },

      // 🔥 SAFE OBJECT ID CONVERSION
      {
        $addFields: {
          formObjectId: {
            $toObjectId: "$_id"
          }
        }
      },

      // 🔥 LOOKUP
      {
        $lookup: {
          from: "forms",
          localField: "formObjectId",
          foreignField: "_id",
          as: "formDetails"
        }
      },

      {
        $unwind: "$formDetails"
      },

      {
        $project: {
          formId: "$_id",
          totalResponses: 1,
          name: "$formDetails.name",
          companyName: "$formDetails.companyName"
        }
      }
    ]);

    res.json({ success: true, data: result });

  } catch (err) {
    console.log("❌ SUMMARY ERROR:", err);
    res.status(500).json({ message: "Error" });
  }
};

// ================= DELETE RESPONSE =================
export const deleteResponse = async (req, res) => {
  try {
    await FormResponse.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Response deleted"
    });

  } catch (err) {
    console.log("❌ DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};