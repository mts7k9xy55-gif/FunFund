const truthy = new Set(["1", "true", "yes", "on"]);

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }
  return truthy.has(value.toLowerCase());
}

export function isV2PublicEnabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_V2_PUBLIC_ENABLED, true);
}

export function isV2RoomEnabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_V2_ROOM_ENABLED, true);
}

export function isV2BillingEnabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_V2_BILLING_ENABLED, true);
}

export function isV2LegacyHubEnabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_V2_LEGACY_ENABLED, true);
}
