/**
 * v2 Guard utilities.
 *
 * These helpers are intentionally framework-agnostic so they can be consumed by
 * future generated Convex modules without coupling to v1 codegen artifacts.
 */

export interface V2AuthIdentity {
  subject: string;
  tokenIdentifier: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function assertAuthenticated(identity: V2AuthIdentity | null): V2AuthIdentity {
  if (!identity) {
    throw new AuthError("Authentication required");
  }
  return identity;
}

export function assertRoomMember(isMember: boolean): void {
  if (!isMember) {
    throw new AuthError("You are not a member of this room");
  }
}

export function assertOwner(isOwner: boolean): void {
  if (!isOwner) {
    throw new AuthError("Owner permission required");
  }
}
