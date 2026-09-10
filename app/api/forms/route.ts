import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/Form";

const CreateFormSchema = z.object({
  title: z.string().min(2).max(200).trim(),
});

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true, trim: true });
  // 4-char random alphanumeric suffix for uniqueness
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

// GET /api/forms — list all forms (protected by middleware)
export async function GET() {
  try {
    await connectDB();
    const forms = await Form.find()
      .sort({ createdAt: -1 })
      .select("title slug createdAt submissionsCount")
      .lean();

    return NextResponse.json({ forms });
  } catch (err) {
    console.error("[GET /api/forms]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/forms — create a new form (protected by middleware)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { title } = parsed.data;

    await connectDB();

    // Retry on slug collision (extremely unlikely but safe)
    let slug = generateSlug(title);
    let retries = 0;
    while (retries < 5) {
      const exists = await Form.exists({ slug });
      if (!exists) break;
      slug = generateSlug(title);
      retries++;
    }

    const form = await Form.create({ title, slug, submissionsCount: 0 });
    return NextResponse.json({ form }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/forms]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
