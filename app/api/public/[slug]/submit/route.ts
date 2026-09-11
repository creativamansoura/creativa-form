import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";
import { Submission } from "@/models/Submission";

const SubmitSchema = z.object({
  fullName: z.string().min(2).max(200).trim(),
  nationalId: z.string().regex(/^\d{14}$/, "الرقم القومي يجب أن يتكون من 14 رقم").trim(),
  university: z.string().min(2).max(200).trim(),
  college: z.string().min(2).max(200).trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s\-()]{7,20}$/, "رقم الهاتف غير صحيح"),
});

// POST /api/public/[slug]/submit — public, no auth
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // [Rate-limit hook: easy to add Upstash/Redis check here in v2]
  try {
    const { slug } = params;
    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    await connectDB();

    const form = await Form.findOne({ slug: slug.trim() }).select("_id isActive");
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.isActive === false) {
      return NextResponse.json({ error: "Registration is closed for this form" }, { status: 403 });
    }

    const { fullName, nationalId, university, college, email, phone } = parsed.data;

    await Submission.create({
      formId: form._id,
      fullName,
      nationalId,
      university,
      college,
      email,
      phone,
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
