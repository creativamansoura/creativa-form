import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";
import { verifyTokenEdge, COOKIE_NAME } from "@/lib/auth";
import { DEFAULT_FORM_FIELDS } from "@/lib/constants";

// GET /api/forms/[id]/fields
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyTokenEdge(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    await connectDB();
    const form = await Form.findById(id).select("title fields").lean();
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const fields = form.fields && form.fields.length > 0 ? form.fields : DEFAULT_FORM_FIELDS;

    return NextResponse.json({ title: form.title, fields });
  } catch (err) {
    console.error("[GET fields]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/forms/[id]/fields
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyTokenEdge(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const { fields } = await req.json();
    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await connectDB();
    const form = await Form.findByIdAndUpdate(
      id,
      { fields },
      { new: true }
    );

    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    return NextResponse.json({ ok: true, fields: form.fields });
  } catch (err) {
    console.error("[PUT fields]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
