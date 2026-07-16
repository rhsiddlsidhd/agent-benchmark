export type AlertType = "error" | "success" | "info" | "warning";

export type AlertProps = {
  type?: AlertType;
  children: React.ReactNode;
  className?: string;
};
