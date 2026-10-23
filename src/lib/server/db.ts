import "server-only";

import { Permission, Role } from "node-appwrite";

export const userRead = (userId: string) => [
  Permission.read(Role.user(userId)),
];

export const communityRead = () => [Permission.read(Role.users())];

export const loanPartiesRead = (ownerId: string, borrowerId: string) => [
  Permission.read(Role.user(ownerId)),
  Permission.read(Role.user(borrowerId)),
];

export function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function profileSummary(profile: {
  $id: string;
  display_name: string;
  trust_score: number;
  locality: string;
}) {
  return {
    $id: profile.$id,
    display_name: profile.display_name,
    trust_score: profile.trust_score,
    locality: profile.locality,
  };
}
