
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
