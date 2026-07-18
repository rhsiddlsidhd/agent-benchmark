"use server";

import * as nodemailer from "nodemailer";

// 이메일 전송 서비스

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_KEY,
  },
});

export const sendEmail = async ({
  email,
  path,
}: {
  email: string;
  path: string;
}): Promise<void> => {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "[WeddingCard] 비밀번호 재설정을 하세요.",
    html: `
      <div style="max-width: 480px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif;">
        <h2 style="margin-bottom: 12px;">비밀번호 재설정 안내</h2>

        <p style="margin-bottom: 16px;">
          아래 버튼을 클릭하여 비밀번호 재설정을 진행해주세요.
        </p>

        <p style="color: #d9534f; font-weight: bold; margin-bottom: 24px;">
          ⏱ 이 링크는 보안을 위해 생성 시점부터 10분 동안만 유효합니다.
        </p>

        <!-- Card -->
        <div
          style="
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            background-color: #f9fafb;
          "
        >
          <a
            href="${path}"
            target="_blank"
            style="
              display: inline-block;
              padding: 14px 24px;
              background-color: #4a90e2;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
            "
          >
            비밀번호 재설정하기
          </a>
        </div>

        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
          본 메일은 발신 전용이며, 문의사항은 고객센터를 이용해주세요.
        </p>
      </div>
    `,
  });
};
