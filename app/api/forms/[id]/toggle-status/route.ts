import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";
import { verifyTokenEdge } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/auth";

// PATCH /api/forms/[id]/toggle-status (protected)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyTokenEdge(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await connectDB();
    const form = await Form.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, isActive: form.isActive });
  } catch (err) {
    console.error("[toggle-status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
