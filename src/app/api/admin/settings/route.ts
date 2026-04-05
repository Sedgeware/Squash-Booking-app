import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSetting, setSetting, settingBool } from "@/lib/settings";

const ALLOWED_KEYS = ["bookingsEnabled"] as const;
type AllowedKey = (typeof ALLOWED_KEYS)[number];

/**
 * GET /api/admin/settings
 * Returns current values for all managed settings.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const entries = await Promise.all(
    ALLOWED_KEYS.map(async (key) => [key, settingBool(await getSetting(key))])
  );

  return NextResponse.json(Object.fromEntries(entries));
}

/**
 * PATCH /api/admin/settings
 * Update a single setting value.
 * Body: { key: AllowedKey, value: boolean }
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value } = body as { key: AllowedKey; value: boolean };

    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: `Unknown setting: ${key}` }, { status: 400 });
    }
    if (typeof value !== "boolean") {
      return NextResponse.json({ error: "value must be a boolean." }, { status: 400 });
    }

    await setSetting(key, String(value));
    return NextResponse.json({ key, value });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
