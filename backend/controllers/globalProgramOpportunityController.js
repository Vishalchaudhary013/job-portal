import GlobalProgramOpportunity from "../models/globalProgramOpportunityModel.js";
import xlsx from "xlsx";
import ExcelJS from "exceljs";
import {
  syncExportToUserSheet,
  applySheetSyncHeaders,
} from "../services/userExportSheet.js";

const OPPORTUNITY_TYPE = "Global Program";

const getOwnerFilter = (req) => {
  if (req.user?.role === "super_admin") {
    return {};
  }

  return { createdBy: req.user?._id };
};

const parseSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => skill.trim()).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizePayload = (body) => ({
  ...body,
  type: OPPORTUNITY_TYPE,
  skills: parseSkills(body.skills),
});

const mapRows = (opportunities, responseCounts = {}) =>
  opportunities.map((item) => ({
    "Name": item.title,
    "Company": item.company,
    "Location": item.location,
    "Responses": responseCounts[item._id.toString()] || 0,
    "Date": item.deadline
      ? new Date(item.deadline).toISOString().split("T")[0]
      : "",
    "Status": item.listing === "active" ? "Active" : "Closed",
  }));

const sendFile = async (res, format, rows, filename) => {
  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

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
        cell.border = { bottom: { style: 'thin' } };
      });

      rows.forEach(rowData => {
        worksheet.addRow(Object.values(rowData));
      });

      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = maxLength < 12 ? 12 : maxLength > 50 ? 50 : maxLength + 2;
      });
    }

    const fileBuffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
    res.status(200).send(fileBuffer);
    return;
  }

  const worksheet = xlsx.utils.json_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
  const fileBuffer = xlsx.write(workbook, { type: "buffer", bookType: "csv" });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.status(200).send(fileBuffer);
};

export const getGlobalPrograms = async (req, res, next) => {
  try {
    const opportunities = await GlobalProgramOpportunity.find({
      type: OPPORTUNITY_TYPE,
    })
      .populate({ path: "createdBy", select: "fullName email role" })
      .sort({
        createdAt: -1,
      });
    res.status(200).json(opportunities);
  } catch (error) {
    next(error);
  }
};

export const getGlobalProgramById = async (req, res, next) => {
  try {
    const opportunity = await GlobalProgramOpportunity.findOne({
      _id: req.params.id,
      type: OPPORTUNITY_TYPE,
    }).populate({ path: "createdBy", select: "fullName email role" });

    if (!opportunity) {
      res
        .status(404)
        .json({ message: "Global program opportunity not found." });
      return;
    }

    res.status(200).json(opportunity);
  } catch (error) {
    next(error);
  }
};

export const createGlobalProgram = async (req, res, next) => {
  try {
    const payload = {
      ...normalizePayload(req.body),
      createdBy: req.user._id,
    };
    const opportunity = await GlobalProgramOpportunity.create(payload);
    await opportunity.populate({
      path: "createdBy",
      select: "fullName email role",
    });
    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
};

export const updateGlobalProgram = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);

    const opportunity = await GlobalProgramOpportunity.findOneAndUpdate(
      {
        _id: req.params.id,
        type: OPPORTUNITY_TYPE,
        ...getOwnerFilter(req),
      },
      payload,
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate({ path: "createdBy", select: "fullName email role" });

    if (!opportunity) {
      res
        .status(404)
        .json({ message: "Global program opportunity not found." });
      return;
    }

    res.status(200).json(opportunity);
  } catch (error) {
    next(error);
  }
};

export const deleteGlobalProgram = async (req, res, next) => {
  try {
    const opportunity = await GlobalProgramOpportunity.findOneAndDelete({
      _id: req.params.id,
      type: OPPORTUNITY_TYPE,
      ...getOwnerFilter(req),
    });

    if (!opportunity) {
      res
        .status(404)
        .json({ message: "Global program opportunity not found." });
      return;
    }

    res.status(200).json({ message: "Global program deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const exportGlobalPrograms = async (req, res, next) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase();
    if (format !== "csv" && format !== "xlsx") {
      res.status(400).json({ message: "Invalid format. Use csv or xlsx." });
      return;
    }

    const opportunities = await GlobalProgramOpportunity.find({
      type: OPPORTUNITY_TYPE,
      ...getOwnerFilter(req),
    }).sort({
      createdAt: -1,
    });

    const rows = mapRows(opportunities);

    if (req.query.target === "sheet") {
      const sheetSync = await syncExportToUserSheet({
        user: req.user,
        tabName: "Global Programs",
        rows,
      });
      applySheetSyncHeaders(res, sheetSync);
      res.status(200).json(sheetSync);
      return;
    }

    await sendFile(res, format, rows, "global-programs");
  } catch (error) {
    next(error);
  }
};
