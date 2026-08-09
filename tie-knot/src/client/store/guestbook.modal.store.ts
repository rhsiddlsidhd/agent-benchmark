import { create } from "zustand";

export type GuestbookModalType =
  | "WRITE_GUESTBOOK"
  | "DELETE_GUESTBOOK"
  | "VIEW_CONTACT";

interface InitialState {
  isOpen: boolean;
  type: GuestbookModalType | null;
  payload: unknown;
}

interface InitialAction {
  setIsOpen: (args: {
    isOpen: boolean;
    type: GuestbookModalType;
    payload: unknown;
  }) => void;
  closeModal: () => void;
  clearIsOpen: () => void;
}

const initialState: InitialState = {
  isOpen: false,
  type: null,
  payload: null,
};

export const useGuestbookModalStore = create<InitialState & InitialAction>(
  (set) => ({
    ...initialState,
    setIsOpen: ({ isOpen, type, payload }) =>
      set(() => ({ isOpen, type, payload })),
    closeModal: () => set({ isOpen: false }),
    clearIsOpen: () => set({ ...initialState }),
  }),
);
