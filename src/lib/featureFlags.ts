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

export function isWeightsV2Enabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_WEIGHTS_V2_ENABLED, true);
}

export function isDecisionV2Enabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_DECISION_V2_ENABLED, true);
}

export function isPayoutsV1Enabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_PAYOUTS_V1_ENABLED, false);
}
