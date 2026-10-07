
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("name" in body) ||
      !("email" in body) ||
      !("password" in body)
    ) {
      return Response.json(
        { message: "Invalid request data." },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return Response.json(
        { message: "Invalid request data." },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return Response.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return Response.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return Response.json(
        {
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return Response.json(
      {
        message: "Account created successfully!",
        user,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration failed:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
