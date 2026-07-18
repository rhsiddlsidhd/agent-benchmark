import UpdatePasswordForm from "@/components/organisms/UpdatePasswordForm";
import React, { Suspense } from "react";

const ResetPassword = () => {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
};

export default ResetPassword;
