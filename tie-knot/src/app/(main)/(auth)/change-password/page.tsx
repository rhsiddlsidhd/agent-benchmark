import { UpdatePasswordForm } from "./_components";
import React, { Suspense } from "react";

const ResetPassword = () => {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
};

export default ResetPassword;
