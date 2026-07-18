import React from "react";
import { AlertProps, AlertType } from "@/types/alert";
import { TypographyP } from "../atoms/typoqraphy";
const Alert = ({ type = "info", children }: AlertProps) => {
  const config: { [key in AlertType]: string } = {
    error: "bg-[#fee] text-red-700 ",
    success: "bg-[#f0fff4] text-green-700 ",
    info: "bg-[#ebf8ff] text-blue-700 ",
    warning: "bg-[#fffaf0] text-yellow-700 ",
  };

  return (
    <TypographyP className={`${config[type]} p-2 text-xs`}>
      {children}
    </TypographyP>
  );
};

export default Alert;
