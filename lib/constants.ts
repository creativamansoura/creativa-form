import { IFormField } from "@/models/Form";

export const DEFAULT_FORM_FIELDS: IFormField[] = [
  { id: "fullName", type: "short_answer", label: "الاسم بالكامل باللغة العربية", required: true },
  { id: "nationalId", type: "short_answer", label: "الرقم القومي", required: true },
  { id: "phone", type: "short_answer", label: "رقم التواصل واتساب", required: true },
  { id: "email", type: "short_answer", label: "البريد الإلكتروني", required: true },
  { id: "university", type: "short_answer", label: "الجامعة", required: true },
  { id: "college", type: "short_answer", label: "الكلية", required: true },
];
