import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENING_HOUR, CLOSING_HOUR, COURTS } from "@/lib/utils";

// GET /api/bookings?date=YYYY-MM-DD
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: { date },
    include: { user: { select: { name: true } } },
    orderBy: [{ court: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(bookings);
}

// POST /api/bookings
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  // Members require an active membership; admins are exempt
  if (!isAdmin) {
    const membership = await prisma.membership.findFirst({
      where: { userId, status: "ACTIVE", currentPeriodEnd: { gte: new Date() } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "An active membership is required to book a court." },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  const { court, date, startTime } = body as { court: number; date: string; startTime: number };

  // Validate inputs (applies to everyone)
  if (!COURTS.includes(court)) {
    return NextResponse.json({ error: "Invalid court." }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  if (!Number.isInteger(startTime) || startTime < OPENING_HOUR || startTime >= CLOSING_HOUR) {
    return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
  }

  // Past bookings blocked for everyone
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const today = todayDate.toISOString().split("T")[0];

  if (date < today) {
    return NextResponse.json({ error: "Cannot book in the past." }, { status: 400 });
  }

  // 7-day advance limit applies to members only
  if (!isAdmin) {
    const maxDate = new Date(todayDate);
    maxDate.setDate(maxDate.getDate() + 7);
    const maxDateStr = maxDate.toISOString().split("T")[0];
    if (date > maxDateStr) {
      return NextResponse.json(
        { error: "Bookings can only be made up to 7 days in advance." },
        { status: 400 }
      );
    }
  }

  const endTime = startTime + 1;

  // Prevent double booking (same court + date + time) — applies to everyone
  const conflict = await prisma.booking.findUnique({
    where: { court_date_startTime: { court, date, startTime } },
  });
  if (conflict) {
    return NextResponse.json({ error: "This slot is already booked." }, { status: 409 });
  }

  // Back-to-back restriction applies to members only
  if (!isAdmin) {
    const backToBack = await prisma.booking.findFirst({
      where: {
        userId,
        date,
        OR: [
          { endTime: startTime }, // existing booking ends when new one starts
          { startTime: endTime }, // existing booking starts when new one ends
        ],
      },
    });
    if (backToBack) {
      return NextResponse.json(
        { error: "Back-to-back bookings are not allowed." },
        { status: 409 }
      );
    }
  }

  const booking = await prisma.booking.create({
    data: { userId, court, date, startTime, endTime },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(booking, { status: 201 });
}
