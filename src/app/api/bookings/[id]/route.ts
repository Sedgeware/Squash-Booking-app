import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/bookings/[id]
// Next.js 15+ requires params to be awaited
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // Only the owner or an admin can cancel
  if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Non-admins can only cancel future bookings
  if (session.user.role !== "ADMIN") {
    const today = new Date().toISOString().split("T")[0];
    if (booking.date < today) {
      return NextResponse.json({ error: "Cannot cancel a past booking." }, { status: 409 });
    }
  }

  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
