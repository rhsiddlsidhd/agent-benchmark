import { Button } from "@/components/atoms/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import TextField from "@/components/molecules/TextField";
import SwitchField from "@/components/molecules/SwitchField";
import { cn } from "@/lib/utils";
import { APIResponse } from "@/types";
import { getFieldError } from "@/utils";

interface CreateGuestbookFormProps {
  coupleInfoId: string;
  action: (formData: FormData) => void;
  pending: boolean;
  state: APIResponse<{ message: string }> | null;
}

export function CreateGuestbookForm({
  coupleInfoId,
  action,
  pending,
  state,
}: CreateGuestbookFormProps) {
  const authorError = getFieldError(state, "author");
  const passwordError = getFieldError(state, "password");

  return (
    <form action={action} className="space-y-4">
      <DialogHeader>
        <DialogTitle>방명록 작성</DialogTitle>
        <DialogDescription>소중한 축하 메시지를 남겨주세요.</DialogDescription>
      </DialogHeader>

      <input type="hidden" name="coupleInfoId" value={coupleInfoId} />

      <TextField
        name="author"
        placeholder="이름을 입력하세요."
        id="author"
        type="text"
        required
        error={authorError}
      >
        이름
      </TextField>

      <TextField
        type="password"
        name="password"
        id="password"
        placeholder="비밀번호를 입력하세요."
        error={passwordError}
      >
        비밀번호
      </TextField>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          메시지
        </label>
        <textarea
          name="message"
          id="message"
          placeholder="메시지를 입력하세요."
          rows={5}
          required
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          )}
        />
      </div>

      <SwitchField id="isPrivate" name="isPrivate">
        비밀글
      </SwitchField>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            취소
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "전송 중..." : "축하 글 전달하기"}
        </Button>
      </DialogFooter>
    </form>
  );
}
