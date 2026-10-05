import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";
import { DEFAULT_FORM_FIELDS } from "@/lib/constants";

// GET /api/public/[slug] — public, returns form title only
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    await connectDB();
    const form = await Form.findOne({ slug: slug.trim() })
      .select("title slug isActive fields")
      .lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const fields = form.fields && form.fields.length > 0 ? form.fields : DEFAULT_FORM_FIELDS;

    return NextResponse.json({ 
      title: form.title, 
      slug: form.slug, 
      isActive: form.isActive !== false,
      fields
    });
  } catch (err) {
    console.error("[GET /api/public/slug]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
