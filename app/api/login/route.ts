
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      !("password" in body)
    ) {
      return Response.json(
        { message: "Invalid request data." },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return Response.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return Response.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return Response.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 1. ساخت توکن امن برای Session
    const sessionToken = randomBytes(32).toString("hex");

    // 2. فقط Hash توکن داخل دیتابیس ذخیره می‌شود
    const tokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    // 3. Session به مدت 30 روز معتبر است
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    await prisma.session.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // 4. توکن واقعی فقط داخل Cookie قرار می‌گیرد
    const cookieStore = await cookies();

    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return Response.json(
      {
        message: "Login successful!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login failed:", error);

    return Response.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
