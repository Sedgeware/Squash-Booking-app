import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile
 * Returns the current user's profile data (name, phone, avatarUrl, ladder prefs).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { userId: session.user.id },
    select: { showPhone: true, showEmail: true, availability: true, status: true },
  });

  return NextResponse.json({ ...user, ladderPrefs: ladderPlayer ?? null });
}

/**
 * PATCH /api/profile
 * Updates name, phone, and/or ladder visibility preferences.
 * Body: { name?: string; phone?: string; showPhone?: boolean; showEmail?: boolean }
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json() as {
    name?: string;
    phone?: string;
    showPhone?: boolean;
    showEmail?: boolean;
    availability?: string;
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (trimmed.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }
    body.name = trimmed;
  }

  if (body.phone !== undefined && body.phone !== "") {
    const cleaned = body.phone.trim();
    if (cleaned.length > 20) {
      return NextResponse.json({ error: "Phone number is too long." }, { status: 400 });
    }
    body.phone = cleaned;
  }

  // ── Update User ───────────────────────────────────────────────────────────
  const userUpdate: { name?: string; phone?: string | null } = {};
  if (body.name !== undefined) userUpdate.name = body.name;
  if (body.phone !== undefined) userUpdate.phone = body.phone === "" ? null : body.phone;

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdate,
    });
  }

  // ── Validate availability value if provided ───────────────────────────────
  if (body.availability !== undefined && !["AVAILABLE", "AWAY"].includes(body.availability)) {
    return NextResponse.json({ error: "Invalid availability value." }, { status: 400 });
  }

  // ── Update ladder prefs (visibility + availability, only if player exists) ─
  if (
    body.showPhone !== undefined ||
    body.showEmail !== undefined ||
    body.availability !== undefined
  ) {
    const ladderPlayer = await prisma.ladderPlayer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (ladderPlayer) {
      const lpUpdate: { showPhone?: boolean; showEmail?: boolean; availability?: string } = {};
      if (body.showPhone !== undefined) lpUpdate.showPhone = body.showPhone;
      if (body.showEmail !== undefined) lpUpdate.showEmail = body.showEmail;
      if (body.availability !== undefined) lpUpdate.availability = body.availability;
      await prisma.ladderPlayer.update({
        where: { id: ladderPlayer.id },
        data: lpUpdate,
      });
    }
  }

  return NextResponse.json({ success: true });
}
