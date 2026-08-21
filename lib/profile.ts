export const AVATAR_KEYS = ["moon", "star", "book", "lantern", "leaf"] as const;
export type AvatarKey = (typeof AVATAR_KEYS)[number];
