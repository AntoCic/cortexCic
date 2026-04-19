export const MemberRole = {
  Admin: 'admin',
  Member: 'member',
} as const;

export type MemberRoleValue = (typeof MemberRole)[keyof typeof MemberRole];

export function getValue(key: string): MemberRoleValue | undefined {
  return Object.values(MemberRole).find((v) => v === key) as MemberRoleValue | undefined;
}

export function isMemberRole(val: unknown): val is MemberRoleValue {
  return Object.values(MemberRole).includes(val as MemberRoleValue);
}
