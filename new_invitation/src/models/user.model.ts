import mongoose, { Schema, Document, Model } from "mongoose";
export type UserRole = "USER" | "ADMIN";
export interface BaseUser {
  email: string;
  name: string;
  phone: string;
  password: string;
}

interface UserModel extends BaseUser {
  role: UserRole;
  isDelete: boolean;
}

export interface UserDocument extends UserModel, Document {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

export default User;
