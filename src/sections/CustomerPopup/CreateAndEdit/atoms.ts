import { atom } from "jotai";

export interface FormData {
  name: string;
  productId: string;
  description: string
}

export const formDataAtom = atom<FormData>({
  name: "",
  productId: "",
  description: "",
});

export const productComponentLoadingAtom = atom(true);
