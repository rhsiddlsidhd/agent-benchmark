import { HTTPError } from "@/types/error";
import User, { BaseUser, UserDocument } from "@/models/user.model";

import bcrypt from "bcryptjs";
import { dbConnect } from "@/utils/mongodb";
// 유저 생성
export const createUser = async (user: BaseUser): Promise<UserDocument> => {
  await dbConnect();
  const newUser = await new User(user).save();
  return newUser;
};

// 이메일 중복 확인
export const checkEmailDuplicate = async (email: string): Promise<boolean> => {
  await dbConnect();
  const exists = await User.exists({ email });
  return !!exists;
};

// 유저 email 찾기
export const getUserEmail = async ({
  name,
  phone,
}: {
  name: string;
  phone: string;
}): Promise<string> => {
  await dbConnect();
  const user = await User.findOne({ name, phone }).lean<BaseUser>();
  if (!user) throw new HTTPError("유저를 찾을 수가 없습니다.", 404);
  return user.email;
};

// 유저 ID로 유저 찾기
export const getUserById = async (id: string): Promise<UserDocument> => {
  await dbConnect();
  const user = await User.findById(id).lean<UserDocument>();
  if (!user) throw new HTTPError("유저를 찾을 수가 없습니다.", 404);
  return user;
};

// 비밀번호 변경 함수
export const changePassword = async (
  email: string,
  newPassword: string,
): Promise<boolean> => {
  await dbConnect();

  // 새 비밀번호 해싱
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // 비밀번호 업데이트
  const userBeforeUpdate = await User.findOneAndUpdate(
    { email, isDelete: false },
    { password: hashedNewPassword },
  );

  return !!userBeforeUpdate;
};
