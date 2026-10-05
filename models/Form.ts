import { Schema, model, models, Document } from "mongoose";

export interface IFormField {
  id: string;
  type: "short_answer" | "paragraph" | "multiple_choice" | "checkboxes" | "dropdown";
  label: string;
  required: boolean;
  options?: string[];
}

export interface IForm extends Document {
  title: string;
  slug: string;
  isActive: boolean;
  fields?: IFormField[];
  createdAt: Date;
  submissionsCount: number;
}

const FormSchema = new Schema<IForm>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
    fields: { type: [Schema.Types.Mixed], default: undefined },
    submissionsCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FormSchema.index({ slug: 1 }, { unique: true });

export const Form = models.Form || model<IForm>("Form", FormSchema);
