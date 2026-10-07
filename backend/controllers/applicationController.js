import Application from "../models/applicationModel.js";
import InternshipOpportunity from "../models/internshipOpportunityModel.js";
import GlobalProgramOpportunity from "../models/globalProgramOpportunityModel.js";
import User from "../models/userModel.js";
import BuilderResume from "../models/builderResumeModel.js";
import {
  sendAdminApplicationAlertEmail,
  sendApplicationConfirmationEmail,
  sendApplicationSelectionEmail,
  sendApplicationRejectionEmail,
} from "../utils/mailer.js";
import { sendApplicationWhatsAppNotifications } from "../utils/whatsapp.js";
import xlsx from "xlsx";
import ExcelJS from "exceljs";
import {
  syncExportToUserSheet,
  applySheetSyncHeaders,
} from "../services/userExportSheet.js";

const absoluteUrl = (req, p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return `${req.protocol}://${req.get("host")}${p.startsWith("/") ? "" : "/"}${p}`;
};

// For a set of applications, look up the applicant's ACCOUNT resumes by email:
// the resume they uploaded at signup and the latest one they built in the Resume
// Builder. Returns a Map keyed by lowercased email.
const resumesByApplicantEmail = async (applications, req) => {
  const emails = [
    ...new Set(
      applications
        .map((a) => String(a.email || "").toLowerCase().trim())
        .filter(Boolean),
    ),
  ];
  if (emails.length === 0) return new Map();

  const users = await User.find({ email: { $in: emails } })
    .select("email resumeFilePath resumeFileName")
    .lean();

  const userByEmail = new Map(users.map((u) => [String(u.email).toLowerCase(), u]));

  const builtByUser = new Map();
  if (users.length > 0) {
    const rows = await BuilderResume.aggregate([
      { $match: { status: "SAVED", userId: { $in: users.map((u) => u._id) } } },
      { $sort: { finalizedAt: -1 } },
      { $group: { _id: "$userId", fileUrl: { $first: "$fileUrl" }, fileName: { $first: "$fileName" } } },
    ]);
    rows.forEach((r) => builtByUser.set(String(r._id), r));
  }

  const out = new Map();
  emails.forEach((email) => {
    const u = userByEmail.get(email);
    const built = u ? builtByUser.get(String(u._id)) : null;
    out.set(email, {
      accountResumeUrl: absoluteUrl(req, u?.resumeFilePath),
      accountResumeName: u?.resumeFileName || "",
      builderResumeUrl: absoluteUrl(req, built?.fileUrl),
      builderResumeName: built?.fileName || "",
    });
  });
  return out;
};

const INTERNSHIP_COLLECTION_TYPES = ["Internship", "Jobs", "Apprenticeships"];

const findOpportunityByTypeAndId = async (opportunityType, opportunityId) => {
  if (!opportunityId) {
    return null;
  }

  // Jobs and Apprenticeships live in the same collection as Internships.
  // if (opportunityType === "Internship") {
  if (INTERNSHIP_COLLECTION_TYPES.includes(opportunityType)) {
    return InternshipOpportunity.findById(opportunityId)
      .select("_id title company type createdBy")
      .populate("createdBy", "_id fullName email role whatsappNumber");
  }

  if (opportunityType === "Global Program") {
    return GlobalProgramOpportunity.findById(opportunityId)
      .select("_id title company type createdBy")
      .populate("createdBy", "_id fullName email role whatsappNumber");
  }

  return null;
};

const pickApplicationPayload = (body) => ({
  opportunityTitle: body.opportunityTitle,
  opportunityType: body.opportunityType,
  company: body.company,
  name: body.name,
  email: body.email,
  phone: body.phone,
  college: body.college,
  degree: body.degree,
  year: body.year,
  skills: body.skills,
  experience: body.experience,
  portfolio: body.portfolio,
  linkedin: body.linkedin,
  whySelectYou: body.whySelectYou,
});

const getOwnedOpportunityIdsForAdmin = async (adminId) => {
  const [internships, globalPrograms] = await Promise.all([
    InternshipOpportunity.find({ createdBy: adminId }).select("_id"),
    GlobalProgramOpportunity.find({ createdBy: adminId }).select("_id"),
  ]);

  return [...internships, ...globalPrograms].map((item) => item._id);
};

const getApplicationOwnershipFilter = async (req) => {
  if (req.user?.role === "super_admin") {
    return {};
  }

  const opportunityIds = await getOwnedOpportunityIdsForAdmin(req.user._id);
  return {
    opportunity: { $in: opportunityIds },
  };
};

const resolveAdminRecipient = async (opportunityDoc) => {
  const owner = opportunityDoc?.createdBy;
  if (!owner) {
    return null;
  }

  if (typeof owner === "object" && owner.email) {
    return owner;
  }

  const ownerId =
    typeof owner === "string" ? owner : owner?._id || owner?.id || null;
  if (!ownerId) {
    return null;
  }

  return User.findById(ownerId)
    .select("_id fullName email role whatsappNumber")
    .lean();
};

export const submitApplication = async (req, res, next) => {
  try {
    // if (!req.file) {
    //   res.status(400).json({ message: "Resume PDF is required." });
    //   return;
    // }

    const payload = pickApplicationPayload(req.body);

    if (!payload.opportunityTitle || !payload.opportunityType) {
      res.status(400).json({ message: "Opportunity details are required." });
      return;
    }

    let opportunityId = null;
    let opportunityDoc = null;
    let applicantAccount = null;
    if (req.body.opportunityId) {
      const opportunity = await findOpportunityByTypeAndId(
        payload.opportunityType,
        req.body.opportunityId,
      );
      if (opportunity) {
        opportunityId = opportunity._id;
        opportunityDoc = opportunity;
      }
    }

    if (payload.email) {
      applicantAccount = await User.findOne({ email: payload.email })
        .select("_id whatsappNumber")
        .lean();
    }

    const adminRecipient = await resolveAdminRecipient(opportunityDoc);

    const application = await Application.create({
      ...payload,
      opportunity: opportunityId,
      // resume: {
      //   fileName: req.file.originalname,
      //   filePath: `/uploads/resumes/${req.file.filename}`,
      //   mimeType: req.file.mimetype,
      //   size: req.file.size,
      // },
      // Resume is optional (see the commented-out check above), so only
      // record it when one was uploaded.
      ...(req.file
        ? {
            resume: {
              fileName: req.file.originalname,
              filePath: `/uploads/resumes/${req.file.filename}`,
              mimeType: req.file.mimetype,
              size: req.file.size,
            },
          }
        : {}),
    });

    if (opportunityId) {
      // if (payload.opportunityType === "Internship") {
      if (INTERNSHIP_COLLECTION_TYPES.includes(payload.opportunityType)) {
        await InternshipOpportunity.findByIdAndUpdate(opportunityId, {
          $push: { submissionIds: application._id }
        });
      } else if (payload.opportunityType === "Global Program") {
        await GlobalProgramOpportunity.findByIdAndUpdate(opportunityId, {
          $push: { submissionIds: application._id }
        });
      }
    }

    let emailConfirmation = {
      sent: false,
      message:
        "Confirmation email was skipped because SMTP settings are not configured.",
    };

    try {
      emailConfirmation = await sendApplicationConfirmationEmail(application);
    } catch (emailError) {
      console.error("Application confirmation email failed:", emailError);
      emailConfirmation = {
        sent: false,
        message:
          "Application was submitted, but the confirmation email could not be sent.",
      };
    }

    const whatsappNotification = await sendApplicationWhatsAppNotifications({
      application,
      applicantRecipient: applicantAccount?.whatsappNumber || payload.phone,
      adminRecipient,
    });

    const adminEmailNotification = await sendAdminApplicationAlertEmail({
      application,
      adminRecipient,
    });

    res.status(201).json({
      application,
      emailConfirmation,
      whatsappNotification,
      adminEmailNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const filter = {
      ...(await getApplicationOwnershipFilter(req)),
    };

    if (req.query.opportunityType) {
      filter.opportunityType = req.query.opportunityType;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await Application.find(filter).sort({ createdAt: -1 }).lean();

    const resumeMap = await resumesByApplicantEmail(applications, req);
    const enriched = applications.map((a) => {
      const r = resumeMap.get(String(a.email || "").toLowerCase()) || {};
      return {
        ...a,
        applicantAccountResumeUrl: r.accountResumeUrl || "",
        applicantBuilderResumeUrl: r.builderResumeUrl || "",
        attachedResumeUrl: absoluteUrl(req, a.resume?.filePath),
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["New", "Shortlisted", "Rejected", "Approved", "Not Approved"];

    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid application status." });
      return;
    }

    const ownershipFilter = await getApplicationOwnershipFilter(req);
    const application = await Application.findOneAndUpdate(
      {
        _id: req.params.id,
        ...ownershipFilter,
      },
      { status },
      { returnDocument: "after", runValidators: true },
    );

    if (!application) {
      res.status(404).json({ message: "Application not found." });
      return;
    }

    if (status === "Approved") {
      await sendApplicationSelectionEmail(application);
    } else if (status === "Not Approved") {
      await sendApplicationRejectionEmail(application);
    }

    res.status(200).json(application);
  } catch (error) {
    next(error);
  }
};

export const exportApplications = async (req, res, next) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase();
    if (format !== "csv" && format !== "xlsx") {
      res.status(400).json({ message: "Invalid format. Use csv or xlsx." });
      return;
    }

    const filter = {
      ...(await getApplicationOwnershipFilter(req)),
    };

    if (req.query.opportunityType) {
      filter.opportunityType = req.query.opportunityType;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await Application.find(filter).sort({ createdAt: -1 }).lean();

    const resumeMap = await resumesByApplicantEmail(applications, req);

    const rows = applications.map((item) => {
      const r = resumeMap.get(String(item.email || "").toLowerCase()) || {};
      return {
        "Applicant": item.name,
        "Email": item.email,
        "Phone": item.phone,
        "Opportunity": item.opportunityTitle || "N/A",
        "Type": item.opportunityType || "N/A",
        "Status": item.status || "New",
        "Applied At": new Date(item.createdAt).toLocaleString(),
        "Attached Resume": absoluteUrl(req, item.resume?.filePath),
        "Account Resume (signup)": r.accountResumeUrl || "",
        "Builder Resume": r.builderResumeUrl || "",
      };
    });

    // "Update Google Sheet" — mirror into the caller's own spreadsheet, no file.
    if (req.query.target === "sheet") {
      const sheetSync = await syncExportToUserSheet({
        user: req.user,
        tabName: "Applications",
        rows,
      });
      applySheetSyncHeaders(res, sheetSync);
      res.status(200).json(sheetSync);
      return;
    }

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Applications");

      if (rows.length > 0) {
        
        const headers = Object.keys(rows[0]);
        const headerRow = worksheet.addRow(headers);
        
       
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE9ECEF' } 
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            bottom: { style: 'thin' }
          };
        });

        rows.forEach(rowData => {
          worksheet.addRow(Object.values(rowData));
        });

        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = maxLength < 12 ? 12 : maxLength > 50 ? 50 : maxLength + 2;
        });
      }

      const fileBuffer = await workbook.xlsx.writeBuffer();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="applications.xlsx"',
      );
      res.status(200).send(fileBuffer);
      return;
    }

    
    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Applications");
    const fileBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "csv",
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="applications.csv"',
    );
    res.status(200).send(fileBuffer);
  } catch (error) {
    next(error);
  }
};
