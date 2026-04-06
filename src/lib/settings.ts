import { prisma } from "./prisma";

/**
 * Default values used when a setting row does not yet exist in the database.
 * Add new feature flags here alongside the schema default.
 */
const DEFAULTS: Record<string, string> = {
  bookingsEnabled: "true",
  membershipsEnabled: "true",
};

/** Read a single setting. Falls back to DEFAULTS then "true". */
export async function getSetting(key: string): Promise<string> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? "true";
  } catch (err) {
    console.error(`[settings] getSetting(${key}) failed — using default`, err);
    return DEFAULTS[key] ?? "true";
  }
}

/** Read multiple settings in one query. */
export async function getSettings(
  keys: string[]
): Promise<Record<string, string>> {
  try {
    const rows = await prisma.appSetting.findMany({ where: { key: { in: keys } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return Object.fromEntries(keys.map((k) => [k, map[k] ?? DEFAULTS[k] ?? "true"]));
  } catch (err) {
    console.error(`[settings] getSettings(${keys}) failed — using defaults`, err);
    return Object.fromEntries(keys.map((k) => [k, DEFAULTS[k] ?? "true"]));
  }
}

/** Upsert a setting value. */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** Convert a stored string value to boolean. */
export function settingBool(value: string): boolean {
  return value === "true";
}
