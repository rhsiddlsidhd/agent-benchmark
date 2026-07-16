import React from "react";

export interface FieldBase {
  id: string;
  name: string;
  children: React.ReactNode;
  defaultValue?: string;
}
