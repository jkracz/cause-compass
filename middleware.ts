import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export function middleware(request: NextRequest) {
  // Check if user already has a userId cookie
  const userId = request.cookies.get("userId")?.value;

  // If no userId exists, create one
  if (!userId) {
    // Create the response (continue to the requested page)
    const response = NextResponse.next();

    // Generate a new user ID
    const newUserId = nanoid();

    // Set the userId cookie on the response
    response.cookies.set("userId", newUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return response;
  }

  // User already has userId, continue normally
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  // Run on all routes except:
  // - API routes (/api/*)
  // - Static files (_next/static/*)
  // - Images (_next/image/*)
  // - Favicon
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
