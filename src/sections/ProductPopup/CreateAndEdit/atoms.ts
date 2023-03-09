import { atom } from "jotai";

export interface FormData {
  name: string;
  graphQLSubsetIds: string[];
}

export const formDataAtom = atom<FormData>({
  name: "",
  graphQLSubsetIds: [],
});

export const graphQLSubsetComponentLoadingAtom = atom(true);
