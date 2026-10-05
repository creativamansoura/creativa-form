import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";
import { Submission } from "@/models/Submission";
import { DEFAULT_FORM_FIELDS } from "@/lib/constants";

// GET /api/forms/[id]/export (protected)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    await connectDB();

    const formId = new mongoose.Types.ObjectId(id);
    const form = await Form.findById(formId).lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const submissions = await Submission.find({ formId })
      .sort({ submittedAt: -1 })
      .lean();

    // --- Build workbook ---
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Creativa Forms";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Submissions", {
      views: [{ showGridLines: true }],
    });

    const fields = form.fields && form.fields.length > 0 ? form.fields : DEFAULT_FORM_FIELDS;

    const headers = fields.map((f: any) => ({
      header: f.label,
      key: f.id,
      width: Math.max(20, f.label.length + 5)
    }));
    headers.push({ header: "Submitted At", key: "submittedAt", width: 24 });

    sheet.columns = headers;

    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF334155" }, // slate-700
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF0f172a" } }, // slate-900
      };
    });

    // Data rows
    submissions.forEach((sub, i) => {
      const rowData: Record<string, any> = {};
      fields.forEach((f: any) => {
        // Check legacy mapping first, then check answers map
        if (f.id === "fullName") rowData[f.id] = sub.fullName;
        else if (f.id === "nationalId") rowData[f.id] = sub.nationalId;
        else if (f.id === "university") rowData[f.id] = sub.university;
        else if (f.id === "college") rowData[f.id] = sub.college;
        else if (f.id === "email") rowData[f.id] = sub.email;
        else if (f.id === "phone") rowData[f.id] = sub.phone;
        else if (sub.answers && sub.answers[f.id]) rowData[f.id] = Array.isArray(sub.answers[f.id]) ? sub.answers[f.id].join(", ") : sub.answers[f.id];
        else rowData[f.id] = "";
      });
      
      rowData.submittedAt = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("en-GB") : "";

      const row = sheet.addRow(rowData);

      row.height = 22;
      const bg = i % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC"; // slate-50
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { name: "Calibri", size: 11 };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, // slate-200
        };
      });
    });

    // Freeze panes below the header row
    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activeCell: "A2" }];

    // Stream buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const safeTitle = form.title.replace(/[^a-z0-9\u0600-\u06FF\s-]/gi, "").trim().replace(/\s+/g, "-");
    const filename = `${safeTitle}-submissions.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
