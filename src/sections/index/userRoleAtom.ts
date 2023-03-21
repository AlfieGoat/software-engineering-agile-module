import { type UserRole } from "@prisma/client";
import { atom } from "jotai";

export const userRoleAtom = atom<UserRole | undefined>(undefined);
