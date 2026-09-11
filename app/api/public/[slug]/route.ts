import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";

// GET /api/public/[slug] — public, returns form title only
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    await connectDB();
    const form = await Form.findOne({ slug: slug.trim() })
      .select("title slug isActive")
      .lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ title: form.title, slug: form.slug, isActive: form.isActive !== false });
  } catch (err) {
    console.error("[GET /api/public/slug]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
