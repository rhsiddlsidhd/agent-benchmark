import { PremiumFeature } from "@/services/premiumFeature.service";
import { Product } from "@/services/product.service";
import { create } from "zustand";

type ModalType = "EDIT-PREMIUMFEATURE" | "EDIT-PRODUCT";

export interface ModalProps {
  product?: Product;
  premiumFeature?: PremiumFeature;
  premiumFeatures?: PremiumFeature[];
}

export interface AdminModalState {
  isOpen: boolean;
  type: null | ModalType;
  props: ModalProps;
}

interface AdminModalAction {
  openModal: (type: AdminModalState["type"], props: ModalProps) => void;
  closeModal: () => void;
}

const initialState: AdminModalState = {
  isOpen: false,
  type: null,
  props: {},
};

export const useAdminModalStore = create<AdminModalState & AdminModalAction>(
  (set) => ({
    ...initialState,
    openModal: (type, props) =>
      set(() => ({ isOpen: true, type: type ?? null, props: props ?? {} })),
    closeModal: () => set(() => ({ ...initialState, isOpen: false })),
  }),
);
