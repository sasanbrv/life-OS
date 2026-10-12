
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      const tokenHash = createHash("sha256")
        .update(sessionToken)
        .digest("hex");

      await prisma.session.deleteMany({
        where: {
          tokenHash,
        },
      });
    }

    cookieStore.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return Response.json({
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout failed:", error);

    return Response.json(
      {
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}
