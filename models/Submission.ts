import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ISubmission extends Document {
  formId: mongoose.Types.ObjectId;
  fullName?: string;
  nationalId?: string;
  university?: string;
  college?: string;
  email?: string;
  phone?: string;
  answers?: Map<string, any>;
  submittedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true, index: true },
    fullName: { type: String, trim: true },
    nationalId: { type: String, trim: true },
    university: { type: String, trim: true },
    college: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    answers: { type: Map, of: Schema.Types.Mixed, default: {} },
    submittedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

export const Submission =
  models.Submission || model<ISubmission>("Submission", SubmissionSchema);
