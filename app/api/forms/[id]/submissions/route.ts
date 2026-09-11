import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";
import { Submission } from "@/models/Submission";
import mongoose from "mongoose";

const PAGE_SIZE = 20;

// GET /api/forms/[id]/submissions?page=1&q=search (protected)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const q = searchParams.get("q")?.trim() ?? "";

    await connectDB();

    const formId = new mongoose.Types.ObjectId(id);
    const form = await Form.findById(formId).select("title submissionsCount isActive").lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Build query — server-side search by name or email
    const query: Record<string, unknown> = { formId };
    if (q) {
      query.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const total = await Submission.countDocuments(query);
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    return NextResponse.json({
      form,
      submissions,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    console.error("[GET submissions]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
