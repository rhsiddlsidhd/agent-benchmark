import { Alert, TextField } from "@/components/molecules";
import { Button, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/atoms";


import { APIResponse } from "@/types";
import { getFieldError } from "@/utils";

interface DeleteGuestbookFormProps {
  guestbookId: string;
  coupleInfoId: string | string[] | undefined;
  productId: string | null;
  action: (formData: FormData) => void;
  pending: boolean;
  state: APIResponse<{ message: string }> | null;
}

export function DeleteGuestbookForm({
  guestbookId,
  coupleInfoId,
  productId,
  action,
  pending,
  state,
}: DeleteGuestbookFormProps) {
  const passwordError = getFieldError(state, "password");

  return (
    <form action={action} className="space-y-4">
      <DialogHeader>
        <input name="guestbookId" defaultValue={guestbookId} hidden />
        <input name="coupleInfoId" defaultValue={coupleInfoId} hidden />
        <input name="productId" defaultValue={productId ?? undefined} hidden />
        <DialogTitle>비밀번호 확인</DialogTitle>

        <DialogDescription>
          계속 진행하려면 비밀번호를 입력해주세요.
        </DialogDescription>
      </DialogHeader>

      <TextField id="password" name="password" type="password">
        비밀번호
      </TextField>
      {passwordError && <Alert type="error">{passwordError}</Alert>}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            취소
          </Button>
        </DialogClose>
        <Button type="submit">{pending ? "삭제 중..." : "전송"}</Button>
      </DialogFooter>
    </form>
  );
}
