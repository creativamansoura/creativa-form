import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";
import { Submission } from "@/models/Submission";

import { DEFAULT_FORM_FIELDS } from "@/lib/constants";

// POST /api/public/[slug]/submit — public, no auth
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // [Rate-limit hook: easy to add Upstash/Redis check here in v2]
  try {
    const { slug } = params;
    const body = await req.json();
    await connectDB();

    const form = await Form.findOne({ slug: slug.trim() }).select("_id isActive fields");
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.isActive === false) {
      return NextResponse.json({ error: "Registration is closed for this form" }, { status: 403 });
    }

    const fields = form.fields && form.fields.length > 0 ? form.fields : DEFAULT_FORM_FIELDS;
    
    const errors: Record<string, string[]> = {};
    const answersMap = new Map<string, any>();
    
    let fullName, nationalId, university, college, email, phone;

    for (const field of fields) {
      const val = body[field.id];
      if (field.required && (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0))) {
        errors[field.id] = ["هذا الحقل مطلوب"];
      }

      // Format validations based on type
      if (val && field.id === "email" && typeof val === "string") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errors[field.id] = ["البريد الإلكتروني غير صحيح"];
      } else if (val && field.id === "nationalId" && typeof val === "string") {
        if (!/^\d{14}$/.test(val)) errors[field.id] = ["الرقم القومي يجب أن يتكون من 14 رقم"];
      } else if (val && field.id === "phone" && typeof val === "string") {
        if (!/^[+\d\s\-()]{7,20}$/.test(val)) errors[field.id] = ["رقم الهاتف غير صحيح"];
      }

      // Legacy mapping
      if (field.id === "fullName") fullName = val;
      else if (field.id === "nationalId") nationalId = val;
      else if (field.id === "university") university = val;
      else if (field.id === "college") college = val;
      else if (field.id === "email") email = val?.toLowerCase();
      else if (field.id === "phone") phone = val;
      else if (val !== undefined) answersMap.set(field.id, val);
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", issues: errors },
        { status: 422 }
      );
    }

    await Submission.create({
      formId: form._id,
      fullName,
      nationalId,
      university,
      college,
      email,
      phone,
      answers: answersMap,
      submittedAt: new Date(),
    });

    // Increment denormalized counter atomically
    await Form.findByIdAndUpdate(form._id, { $inc: { submissionsCount: 1 } });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[POST submit]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
