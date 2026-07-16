import { FeatureModel } from "@/models/product.feature.model";
import { premiumFeatureSchema } from "@/schemas/premiumFeature.schema";
import { dbConnect } from "@/utils/mongodb";

import mongoose from "mongoose";
import z from "zod";
interface FeatureLeanDoc {
  _id: mongoose.Types.ObjectId;
  code: string;
  label: string;
  description?: string;
  additionalPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
// FeatureJSON을 재사용
export type PremiumFeature = {
  _id: string;
  code: string;
  label: string;
  description: string;
  additionalPrice: number;
  isActive: boolean;
  createdAt: string;
};

// Mapper 함수: DB 결과를 PremiumFeature로 변환
const mapToPremiumFeature = (doc: FeatureLeanDoc): PremiumFeature => ({
  _id: String(doc._id),
  code: doc.code,
  label: doc.label,
  description: doc.description ?? "",
  additionalPrice: doc.additionalPrice,
  isActive: doc.isActive,
  createdAt: doc.createdAt.toISOString(),
});

export const createPremiumFeatureService = async (
  data: z.infer<typeof premiumFeatureSchema>,
) => {
  await dbConnect();
  const newFeatureModel = await new FeatureModel(data).save();
  return newFeatureModel;
};

export const getAllPremiumFeatureService = async (): Promise<
  PremiumFeature[]
> => {
  await dbConnect();
  const features = await FeatureModel.find().lean<FeatureLeanDoc[]>();
  return features.map(mapToPremiumFeature);
};

export const getPremiumFeatureService = async (ids: string[] | []) => {
  if (ids.length === 0) return [];
  await dbConnect();
  const _ids = ids.map((id) => new mongoose.Types.ObjectId(id));
  const features = await FeatureModel.find({ _id: { $in: _ids } }).lean<
    FeatureLeanDoc[]
  >();
  return features.map(mapToPremiumFeature);
};

export const updatePremiumFeatureService = async (
  id: string,
  data: z.infer<typeof premiumFeatureSchema>,
) => {
  await dbConnect();

  const updatedFeature = await FeatureModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );

  return updatedFeature;
};
