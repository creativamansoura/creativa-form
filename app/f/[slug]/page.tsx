"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import Image from "next/image";

const SubmitSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(200),
  nationalId: z.string().regex(/^\d{14}$/, "الرقم القومي يجب أن يتكون من 14 رقم"),
  phone: z
    .string()
    .regex(/^[+\d\s\-()]{7,20}$/, "رقم الهاتف غير صحيح")
    .min(7, "رقم الهاتف غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  university: z.string().min(2, "يرجى إدخال اسم الجامعة").max(200),
  college: z.string().min(2, "يرجى إدخال اسم الكلية").max(200),
});

type SubmitForm = z.infer<typeof SubmitSchema>;

export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitForm>({
    resolver: zodResolver(SubmitSchema),
  });

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/public/${slug}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormTitle(data.title);
        if (data.isActive === false) {
          setIsClosed(true);
        }
      } catch {
        setNotFound(true);
      }
    }
    loadForm();
  }, [slug]);

  async function onSubmit(data: SubmitForm) {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(`/api/public/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const json = await res.json();
        setServerError(json.error ?? "حدث خطأ، يرجى المحاولة مجدداً");
      }
    } catch {
      setServerError("تعذّر الاتصال بالخادم، يرجى المحاولة مجدداً");
    } finally {
      setSubmitting(false);
    }
  }

  // --- 404 state ---
  if (notFound) {
    return (
      <main
        dir="rtl"
        lang="ar"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4"
      >
        <div className="text-center max-w-sm">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground">رابط التسجيل هذا غير صحيح أو انتهت صلاحيته</p>
        </div>
      </main>
    );
  }

  // --- Closed state ---
  if (isClosed) {
    return (
      <main
        dir="rtl"
        lang="ar"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 p-4"
      >
        <div className="text-center max-w-sm">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 mb-6">
            <AlertCircle className="h-10 w-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">عذراً، التسجيل مغلق</h1>
          <p className="text-muted-foreground">تم إغلاق باب التسجيل في «{formTitle}»</p>
        </div>
      </main>
    );
  }

  // --- Loading title ---
  if (formTitle === null) {
    return (
      <main
        dir="rtl"
        lang="ar"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  // --- Success state ---
  if (submitted) {
    return (
      <main
        dir="rtl"
        lang="ar"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 p-4"
      >
        <div className="text-center max-w-sm animate-fade-in">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-6 shadow-lg">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-green-800">تم التسجيل بنجاح! 🎉</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-2">
            شكراً على تسجيلك في
          </p>
          <p className="font-semibold text-foreground text-base mb-6">«{formTitle}»</p>
          <p className="text-sm text-muted-foreground">
            سيتم التواصل معك قريباً بتفاصيل إضافية
          </p>
        </div>
      </main>
    );
  }

  // --- Main form ---
  return (
    <main
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 flex items-center justify-center"
    >
      <div className="w-full max-w-xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <Image src="/logo.png" alt="Logo" width={120} height={120} className="object-contain drop-shadow-md" priority />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 leading-snug">{formTitle}</h1>
          <p className="text-muted-foreground text-sm">يرجى تعبئة البيانات التالية للتسجيل</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold">
                  الاسم بالكامل باللغة العربية <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="الاسم بالكامل باللغة العربية"
                  {...register("fullName")}
                  aria-invalid={!!errors.fullName}
                  className="text-right placeholder:text-right h-11"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              {/* National ID */}
              <div className="space-y-2">
                <Label htmlFor="nationalId" className="text-sm font-semibold">
                  الرقم القومي <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nationalId"
                  placeholder="الرقم القومي"
                  dir="ltr"
                  {...register("nationalId")}
                  aria-invalid={!!errors.nationalId}
                  className="text-left placeholder:text-left h-11"
                />
                {errors.nationalId && (
                  <p className="text-xs text-red-600">{errors.nationalId.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">
                  رقم التواصل واتساب <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="رقم التواصل واتساب"
                  dir="ltr"
                  {...register("phone")}
                  aria-invalid={!!errors.phone}
                  className="text-left placeholder:text-left h-11"
                />
                {errors.phone && (
                  <p className="text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="البريد الإلكتروني"
                  dir="ltr"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  className="text-left placeholder:text-left h-11"
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* University */}
              <div className="space-y-2">
                <Label htmlFor="university" className="text-sm font-semibold">
                  الجامعة <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="university"
                  placeholder="الجامعة"
                  {...register("university")}
                  aria-invalid={!!errors.university}
                  className="text-right placeholder:text-right h-11"
                />
                {errors.university && (
                  <p className="text-xs text-red-600">{errors.university.message}</p>
                )}
              </div>

              {/* College */}
              <div className="space-y-2">
                <Label htmlFor="college" className="text-sm font-semibold">
                  الكلية <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="college"
                  placeholder="الكلية"
                  {...register("college")}
                  aria-invalid={!!errors.college}
                  className="text-right placeholder:text-right h-11"
                />
                {errors.college && (
                  <p className="text-xs text-red-600">{errors.college.message}</p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {serverError}
                </div>
              )}

              <Button
                id="submit-registration"
                type="submit"
                className="w-full h-12 text-base font-semibold mt-2 shadow-lg shadow-primary/25"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    جارٍ التسجيل…
                  </>
                ) : (
                  "تسجيل الآن"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-center gap-1 mt-6 text-xs text-muted-foreground" dir="ltr">
          <p>للتواصل والاستفسار</p>
          <div className="flex items-center gap-3">
            <a href="mailto:creativa.mansoura@gmail.com" className="hover:text-primary transition-colors">
              creativa.mansoura@gmail.com
            </a>
            <span>•</span>
            <a href="https://wa.me/201110666043" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
              +20 11 10666043
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
