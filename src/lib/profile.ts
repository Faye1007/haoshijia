import type { UserProfile } from "./firestore";

export const getProfileDisplayName = (
  profile: Pick<UserProfile, "nickname" | "email"> | null | undefined,
  fallbackEmail?: string | null
) => {
  const nickname = profile?.nickname?.trim();
  if (nickname) return nickname;
  return profile?.email || fallbackEmail || "用户";
};

export const getProfileInitial = (displayName: string) => {
  return displayName.trim().charAt(0).toUpperCase() || "好";
};
