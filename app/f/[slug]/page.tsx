"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/public/${slug}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormTitle(data.title);
        setFormFields(data.fields || []);
        if (data.isActive === false) {
          setIsClosed(true);
        }
      } catch {
        setNotFound(true);
      }
    }
    loadForm();
  }, [slug]);

  async function onSubmit(data: any) {
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
        if (json.issues) {
          // Flatten issues
          const issueKeys = Object.keys(json.issues);
          if (issueKeys.length > 0) {
            setServerError(json.issues[issueKeys[0]][0] || "توجد أخطاء في البيانات المدخلة");
          } else {
            setServerError("توجد أخطاء في البيانات المدخلة");
          }
        } else {
          setServerError(json.error ?? "حدث خطأ، يرجى المحاولة مجدداً");
        }
      }
    } catch {
      setServerError("تعذّر الاتصال بالخادم، يرجى المحاولة مجدداً");
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <main dir="rtl" lang="ar" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4">
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

  if (isClosed) {
    return (
      <main dir="rtl" lang="ar" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 p-4">
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

  if (formTitle === null) {
    return (
      <main dir="rtl" lang="ar" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (submitted) {
    return (
      <main dir="rtl" lang="ar" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 p-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-6 shadow-lg">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-green-800">تم التسجيل بنجاح! 🎉</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-2">شكراً على تسجيلك في</p>
          <p className="font-semibold text-foreground text-base mb-6">«{formTitle}»</p>
          <p className="text-sm text-muted-foreground">سيتم التواصل معك قريباً بتفاصيل إضافية</p>
        </div>
      </main>
    );
  }

  const renderField = (field: FormField) => {
    const isLtr = field.id === "email" || field.id === "nationalId" || field.id === "phone";
    
    switch (field.type) {
      case "paragraph":
        return (
          <textarea
            id={field.id}
            placeholder={field.label}
            dir={isLtr ? "ltr" : "rtl"}
            {...register(field.id, { required: field.required ? "هذا الحقل مطلوب" : false })}
            className={`flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${isLtr ? "text-left placeholder:text-left" : "text-right placeholder:text-right"}`}
          />
        );
      case "multiple_choice":
        return (
          <div className="space-y-2 mt-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={opt}
                  {...register(field.id, { required: field.required ? "هذا الحقل مطلوب" : false })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "checkboxes":
        return (
          <div className="space-y-2 mt-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt}
                  {...register(field.id, { required: field.required ? "هذا الحقل مطلوب" : false })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "dropdown":
        return (
          <select
            id={field.id}
            {...register(field.id, { required: field.required ? "هذا الحقل مطلوب" : false })}
            className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">اختر إجابة...</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case "short_answer":
      default:
        return (
          <Input
            id={field.id}
            type={field.id === "email" ? "email" : field.id === "phone" ? "tel" : "text"}
            placeholder={field.label}
            dir={isLtr ? "ltr" : "rtl"}
            {...register(field.id, { required: field.required ? "هذا الحقل مطلوب" : false })}
            className={`h-11 ${isLtr ? "text-left placeholder:text-left" : "text-right placeholder:text-right"}`}
          />
        );
    }
  };

  return (
    <main dir="rtl" lang="ar" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 flex items-center justify-center">
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
              
              {formFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-sm font-semibold">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {renderField(field)}
                  {errors[field.id] && (
                    <p className="text-xs text-red-600">{errors[field.id]?.message as string}</p>
                  )}
                </div>
              ))}

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
