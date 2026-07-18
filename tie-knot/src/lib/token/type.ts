import { UserRole } from "@/models/user.model";

type JWTType = "ACCESS" | "REFRESH" | "ENTRY";

interface JWTBaseProps {
  type: JWTType;
}

interface AccessEncrypt {
  type: "ACCESS";
  id: string;
  role: UserRole;
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

export type EncryptProps = AccessEncrypt | RefreshEncrypt | EntryEncrypt;

export interface DecryptProps extends JWTBaseProps {
  token: string;
}
