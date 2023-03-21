import { atom } from "jotai";

export interface FormData {
  description: string;
  name: string;
  graphQLSchema: string;
}

export const formDataAtom = atom<FormData>({
  description: "",
  name: "",
  graphQLSchema: "",
});
