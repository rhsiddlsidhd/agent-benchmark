import mongoose, { Schema, Types, Model } from "mongoose";

// toJSON() 반환 타입 정의

export interface IFeature {
  _id: Types.ObjectId;
  code: string;
  label: string; // 관리자/프론트용 이름
  description?: string; // 기능 설명
  additionalPrice: number; // 추가 요금
  isActive: boolean; // 활성화 여부
  createdAt: Date;
  updatedAt: Date;
}

const featureSchema = new Schema<IFeature>(
  {
    code: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: String,
    additionalPrice: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

export const FeatureModel =
  (mongoose.models.Feature as Model<IFeature>) ||
  mongoose.model<IFeature>("Feature", featureSchema);
