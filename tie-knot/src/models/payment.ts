import { PAY_METHOD } from "@/constants/payment";
import mongoose, { Document, Model, Schema } from "mongoose";

// --- Enums --- TRANS 실시간 계좌이체 VBANK 가상 계좌

export type PayMethod = (typeof PAY_METHOD)[number]; // 카드 , 계좌이체, 가상계좌, 휴대폰 소액결제

// PortOne이 반환하는 PG사 식별자는 동적이므로 string으로 처리
type PgProvider = string;
export type PayStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "PARTIAL_CANCELLED"
  | "REFUNDED";

export interface Payment extends Document {
  // 식별자
  merchantUid: string; // PortOne의 주문번호 (우리 서버에서 생성)
  impUid?: string; // PortOne 트랜잭션 고유 ID

  // 주문 참조
  orderId: mongoose.Types.ObjectId;

  // 구매자
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;

  // 결제 금액
  requestAmount: number; // 결제 요청 금액 (order.finalPrice와 동일)
  paidAmount?: number; // 실제 결제된 금액 (PortOne에서 제공)

  // PG 결제 정보
  payMethod?: PayMethod; // 결제 수단
  pgProvider?: PgProvider; // PG사
  pgTid?: string; // PG사 거래 고유 ID

  // 결제 상태
  status: PayStatus; // 결제 상태 (PENDING, PAID, FAILED, CANCELLED 등)

  // 카드 정보 (결제 성공 시)
  cardName?: string;
  cardNumber?: string;
  cardQuote?: number;

  // 가상계좌 정보 (vbank 결제 시)
  vbankName?: string;
  vbankNum?: string;
  vbankHolder?: string;
  vbankIssuedAt?: Date; // 가상계좌 발급일시
  vbankDueAt?: Date; // 가상계좌 입금 기한

  // 결제 이력 (Timestamp)
  paidAt?: Date; // 결제 완료 일시
  failedAt?: Date; // 결제 실패 일시
  failReason?: string; // 결제 실패 사유

  cancelledAt?: Date; // 결제 취소 일시
  cancelAmount?: number; // 취소/환불 금액
  cancelReason?: string; // 취소/환불 사유

  // 영수증
  receiptUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<Payment>(
  {
    // 식별자
    merchantUid: { type: String, required: true, unique: true }, // 우리 서버에서 생성, 필수, 고유
    impUid: { type: String, unique: true, sparse: true }, // 포트원에서 생성, 고유 (null 허용)

    // 주문 참조
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true }, // Order 모델 참조, 필수

    // 구매자
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerTel: { type: String, required: true },

    // 결제 금액
    requestAmount: { type: Number, required: true }, // 결제 요청 금액, 필수
    paidAmount: { type: Number }, // 실제 결제 금액

    // PG 결제 정보
    payMethod: {
      type: String,
      enum: ["CARD", "TRANSFER", "VIRTUAL_ACCOUNT", "MOBILE"],
    },
    pgProvider: {
      type: String,
      // enum 제거: PortOne이 반환하는 다양한 PG사 값을 모두 허용
      // 예: "INICIS_V2", "INICIS", "HTML5_INICIS", "NICE_V2", "TOSSPAYMENTS" 등
    },
    pgTid: { type: String },

    // 결제 상태
    status: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "CANCELLED",
        "PARTIAL_CANCELLED",
        "REFUNDED",
      ],
      required: true,
      default: "PENDING", // 초기 상태 PENDING
    },

    // 카드 정보
    cardName: { type: String },
    cardNumber: { type: String },
    cardQuote: { type: Number },

    // 가상계좌 정보
    vbankName: { type: String },
    vbankNum: { type: String },
    vbankHolder: { type: String },
    vbankIssuedAt: { type: Date },
    vbankDueAt: { type: Date },

    // 결제 이력
    paidAt: { type: Date },
    failedAt: { type: Date },
    failReason: { type: String },

    cancelledAt: { type: Date },
    cancelAmount: { type: Number }, // 취소/환불 금액
    cancelReason: { type: String },

    // 영수증
    receiptUrl: { type: String },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 추가
  },
);

export const PaymentModel =
  (mongoose.models.Payment as Model<Payment>) ||
  mongoose.model<Payment>("Payment", paymentSchema);
