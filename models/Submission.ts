import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ISubmission extends Document {
  formId: mongoose.Types.ObjectId;
  fullName: string;
  university: string;
  college: string;
  email: string;
  phone: string;
  submittedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    university: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    submittedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

export const Submission =
  models.Submission || model<ISubmission>("Submission", SubmissionSchema);
