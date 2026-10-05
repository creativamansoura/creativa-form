"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  GripVertical, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

const FIELD_TYPES = [
  { value: "short_answer", label: "إجابة قصيرة (نص)" },
  { value: "paragraph", label: "فقرة (نص طويل)" },
  { value: "multiple_choice", label: "خيارات متعددة (اختيار واحد)" },
  { value: "checkboxes", label: "مربعات اختيار (متعددة)" },
  { value: "dropdown", label: "قائمة منسدلة" },
];

export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    async function loadFields() {
      try {
        const res = await fetch(`/api/forms/${id}/fields`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormTitle(data.title);
        setFields(data.fields || []);
      } catch {
        toast.error("Failed to load fields");
      } finally {
        setLoading(false);
      }
    }
    loadFields();
  }, [id]);

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: "short_answer",
      label: "سؤال جديد",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const updateField = (index: number, key: keyof FormField, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    // Init options if changing to choice type
    if (key === "type" && ["multiple_choice", "checkboxes", "dropdown"].includes(value)) {
      if (!(newFields[index].options || []).length) {
        newFields[index].options = ["خيار 1"];
      }
    }
    setFields(newFields);
  };

  const addOption = (fieldIndex: number) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    const opts = field.options ? [...field.options] : [];
    opts.push(`خيار ${opts.length + 1}`);
    field.options = opts;
    setFields(newFields);
  };

  const updateOption = (fieldIndex: number, optIndex: number, val: string) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    if (field.options) {
      field.options[optIndex] = val;
    }
    setFields(newFields);
  };

  const removeOption = (fieldIndex: number, optIndex: number) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    if (field.options) {
      field.options.splice(optIndex, 1);
    }
    setFields(newFields);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const newFields = [...fields];
    if (index + direction >= 0 && index + direction < newFields.length) {
      const temp = newFields[index];
      newFields[index] = newFields[index + direction];
      newFields[index + direction] = temp;
      setFields(newFields);
    }
  };

  const saveFields = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${id}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حفظ الأسئلة بنجاح!");
      router.push(`/dashboard/forms/${id}`);
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20" dir="rtl">
      {/* Top nav */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href={`/dashboard/forms/${id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="font-bold text-lg">تعديل أسئلة: {formTitle}</h1>
          </div>
          <Button onClick={saveFields} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            حفظ التعديلات
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        
        {fields.map((field, index) => (
          <Card key={field.id} className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-100 flex flex-col items-center justify-center border-r">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-slate-600"
                onClick={() => moveField(index, -1)}
                disabled={index === 0}
              >
                ↑
              </Button>
              <GripVertical className="h-4 w-4 text-slate-300 my-2" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-slate-600"
                onClick={() => moveField(index, 1)}
                disabled={index === fields.length - 1}
              >
                ↓
              </Button>
            </div>
            
            <CardContent className="pl-12 pr-6 py-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <Label>عنوان السؤال</Label>
                  <Input 
                    value={field.label} 
                    onChange={(e) => updateField(index, "label", e.target.value)} 
                    placeholder="اكتب سؤالك هنا..."
                    className="font-medium text-lg"
                  />
                </div>
                
                <div className="w-48 space-y-2">
                  <Label>نوع السؤال</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={field.type}
                    onChange={(e) => updateField(index, "type", e.target.value)}
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {["multiple_choice", "checkboxes", "dropdown"].includes(field.type) && (
                <div className="bg-slate-50 p-4 rounded-lg border space-y-3 mt-4">
                  <Label className="text-muted-foreground">الخيارات</Label>
                  {field.options?.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      <Input 
                        value={opt} 
                        onChange={(e) => updateOption(index, optIndex, e.target.value)} 
                        className="h-9"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-red-500 shrink-0"
                        onClick={() => removeOption(index, optIndex)}
                        disabled={(field.options?.length ?? 0) <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addOption(index)} className="mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    إضافة خيار
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 mt-2 border-t">
                <div className="flex items-center gap-2">
                  <Label className="cursor-pointer flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={field.required}
                      onChange={(e) => updateField(index, "required", e.target.checked)}
                      className="h-4 w-4 text-primary rounded"
                    />
                    مطلوب (Required)
                  </Label>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  حذف السؤال
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={addField} variant="outline" className="w-full h-14 border-dashed border-2 text-primary hover:bg-primary/5">
          <Plus className="h-5 w-5 mr-2" />
          إضافة سؤال جديد
        </Button>
      </main>
    </div>
  );
}
