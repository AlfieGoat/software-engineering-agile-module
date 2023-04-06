import { atom } from "jotai";

export interface FormData {
  description: string;
  name: string;
  graphQLSchema: string;
  query: string;
}

export const formDataAtom = atom<FormData>({
  description: "",
  name: "",
  graphQLSchema: "",
  query: ""
});
