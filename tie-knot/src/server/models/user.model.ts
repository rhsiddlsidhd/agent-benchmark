import mongoose, { Schema, Types, Model } from "mongoose";
export type UserRole = "USER" | "ADMIN";
export interface BaseUser {
  email: string;
  name: string;
  phone: string;
  password: string;
}

export interface IUser extends BaseUser {
  _id: Types.ObjectId;
  role: UserRole;
  isDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
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

export const UserModel =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
