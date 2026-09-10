import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";
import { Submission } from "@/models/Submission";

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

    // Merged title row
    sheet.mergeCells("A1:F1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = form.title;
    titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" }, // dark navy
    };
    sheet.getRow(1).height = 36;

    // Header row (row 2)
    const headers = [
      { header: "Full Name", key: "fullName", width: 28 },
      { header: "University", key: "university", width: 30 },
      { header: "College / Faculty", key: "college", width: 28 },
      { header: "Email", key: "email", width: 32 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Submitted At", key: "submittedAt", width: 24 },
    ];

    sheet.columns = headers;

    const headerRow = sheet.getRow(2);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" }, // blue-600
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF1D4ED8" } },
      };
    });

    // Data rows
    submissions.forEach((sub, i) => {
      const row = sheet.addRow({
        fullName: sub.fullName,
        university: sub.university,
        college: sub.college,
        email: sub.email,
        phone: sub.phone,
        submittedAt: sub.submittedAt
          ? new Date(sub.submittedAt).toLocaleString("en-GB")
          : "",
      });

      row.height = 22;
      const bg = i % 2 === 0 ? "FFFAFAFA" : "FFF0F4FF";
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.alignment = { vertical: "middle" };
        cell.font = { name: "Calibri", size: 10 };
      });
    });

    // Freeze panes below the two header rows
    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 2, topLeftCell: "A3", activeCell: "A3" }];

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
