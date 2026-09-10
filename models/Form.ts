import { Schema, model, models, Document } from "mongoose";

export interface IForm extends Document {
  title: string;
  slug: string;
  createdAt: Date;
  submissionsCount: number;
}

const FormSchema = new Schema<IForm>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    submissionsCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FormSchema.index({ slug: 1 }, { unique: true });

export const Form = models.Form || model<IForm>("Form", FormSchema);
