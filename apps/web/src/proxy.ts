import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export function proxy(request: NextRequest) {
  // Check if user already has a guestId cookie
  const guestId = request.cookies.get("guestId")?.value;

  // If no guestId exists, create one
  if (!guestId) {
    // Create the response (continue to the requested page)
    const response = NextResponse.next();

    // Generate a new user ID
    const newGuestId = nanoid();

    // Set the guestId cookie on the response
    response.cookies.set("guestId", newGuestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return response;
  }

  // User already has guestId, continue normally
  return NextResponse.next();
}

// Configure which routes the proxy should run on
export const config = {
  // Run on all routes except:
  // - API routes (/api/*)
  // - Static files (_next/static/*)
  // - Images (_next/image/*)
  // - Favicon
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
