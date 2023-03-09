import { atom } from "jotai";

export interface FormData {
  description: string;
  name: string;
  graphQLSubsetIds: string[];
}

export const formDataAtom = atom<FormData>({
  description: "",
  name: "",
  graphQLSubsetIds: [],
});

export const graphQLSubsetComponentLoadingAtom = atom(true);
