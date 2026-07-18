import mongoose, { Schema, Model, Types } from "mongoose";

// Guestbook 문서 인터페이스
export interface IGuestbook {
  _id: Types.ObjectId | string;
  coupleInfoId: Types.ObjectId | string; // 어떤 청첩장의 방명록인지 식별 (CoupleInfo 모델 참조)
  author: string; // 작성자 이름
  message: string; // 방명록 내용
  password: string; // 수정/삭제를 위한 비밀번호
  isPrivate: boolean; // 주인만 보기 여부
  createdAt: Date;
}

// Mongoose 스키마 정의
const guestbookSchema = new Schema<IGuestbook>(
  {
    coupleInfoId: {
      type: Schema.Types.ObjectId,
      ref: "CoupleInfo",
      required: true,
      index: true, // 특정 청첩장의 방명록을 조회하는 경우가 많으므로 인덱스 추가
    },
    author: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false, // 기본값은 전체 공개
    },
  },
  {
    timestamps: true,
  },
);

export const GuestbookModel: Model<IGuestbook> =
  mongoose.models.Guestbook ||
  mongoose.model<IGuestbook>("Guestbook", guestbookSchema);
