import { GuestbookModel, IGuestbook } from "@/models";
import { GuestbookType } from "@/schemas";
import { dbConnect } from "@/lib/mongodb";

import mongoose from "mongoose";

export const createGuestbookService = async ({
  data,
}: {
  data: GuestbookType;
}) => {
  await dbConnect();

  const res = await GuestbookModel.create(data);

  if (!res) throw new Error("Failed to create guestbook");
  return res;
};

export const getGuestbookService = async (
  id: string,
): Promise<IGuestbook[]> => {
  await dbConnect();
  const coupleInfoId = new mongoose.Types.ObjectId(id);
  const guestbooks = await GuestbookModel.find({ coupleInfoId })
    .select("-__v -password -updatedAt")
    .sort({
      createdAt: -1,
    })
    .lean();
  return guestbooks.map((guestbook) => ({
    ...guestbook,
    _id: guestbook._id.toString(),
    coupleInfoId: guestbook.coupleInfoId.toString(),
  }));
};

export const getPrivateGuestbookService = async (
  id: string,
): Promise<IGuestbook | null> => {
  await dbConnect();

  const _id = new mongoose.Types.ObjectId(id);
  const guestbook = await GuestbookModel.findById(_id).lean();

  if (!guestbook) return null;

  return {
    ...guestbook,
    _id: guestbook._id.toString(),
    coupleInfoId: guestbook.coupleInfoId.toString(),
  };
};

export const deleteGuestbookService = async (
  id: string,
): Promise<{ acknowledged: boolean; deletedCount: number }> => {
  await dbConnect();

  const _id = new mongoose.Types.ObjectId(id);
  const result = await GuestbookModel.deleteOne({ _id });

  return result;
};
