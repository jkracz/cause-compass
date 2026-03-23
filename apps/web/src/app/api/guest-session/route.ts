import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set("guestId", nanoid(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}
