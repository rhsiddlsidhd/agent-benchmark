// import { z } from "zod";

// // 개인 정보 스키마
// const personSchema = z.object({
//   name: z.string().min(1, "이름을 입력하세요"),
//   phone: z.string().min(1, "연락처를 입력하세요"),
//   accountNumber: z.string().optional(),
// });

// // 혼주 정보 스키마
// const parentsSchema = z.object({
//   father: personSchema.optional(),
//   mother: personSchema.optional(),
// });

// // 갤러리 카테고리 스키마
// const galleryCategorySchema = z.object({
//   id: z.string(),
//   categoryName: z.string().min(1, "카테고리 이름을 입력하세요"),
//   images: z.array(z.string()).min(1, "이미지를 최소 1개 이상 업로드하세요"),
// });

// // 메인 CoupleInfo 스키마
// export const coupleInfoSchema = z.object({
//   // 기본 정보
//   weddingDate: z.date({
//     required_error: "결혼식 날짜를 선택하세요",
//   }),
//   weddingTime: z.string().min(1, "결혼식 시간을 입력하세요"),
//   venueName: z.string().min(1, "예식장명을 입력하세요"),
//   address: z.string().min(1, "주소를 입력하세요"),
//   addressDetail: z.string().optional(),
//   guestbookEnabled: z.boolean().default(true),

//   // 신랑 & 신부 정보
//   groom: personSchema,
//   bride: personSchema,

//   // 혼주 정보
//   groomParents: parentsSchema.optional(),
//   brideParents: parentsSchema.optional(),

//   // 이미지 정보
//   thumbnailImages: z
//     .array(z.string())
//     .min(1, "메인 이미지를 최소 1개 이상 업로드하세요"),
//   galleryCategories: z.array(galleryCategorySchema).optional(),
// });

// // TypeScript 타입
// export type CoupleInfo = z.infer<typeof coupleInfoSchema>;
// export type Person = z.infer<typeof personSchema>;
// export type ParentsInfo = z.infer<typeof parentsSchema>;
// export type GalleryCategory = z.infer<typeof galleryCategorySchema>;
