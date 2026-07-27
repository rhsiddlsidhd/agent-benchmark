import { UserRole } from "@/server/models";
type JWTType = "REFRESH" | "ENTRY";

interface JWTBaseProps {
  type: JWTType;
}

interface RefreshEncrypt {
  type: "REFRESH";
  id: string;
  role: UserRole;
}

interface EntryEncrypt {
  type: "ENTRY";
  id?: string;
}

export type EncryptProps = RefreshEncrypt | EntryEncrypt;

export interface DecryptProps extends JWTBaseProps {
  token: string;
}
