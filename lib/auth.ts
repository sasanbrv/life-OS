
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("session_token")?.value;

  // کاربر لاگین نیست
  if (!sessionToken) {
    return null;
  }

  // همان Hashای که هنگام Login ساختیم
  const tokenHash = createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: true,
    },
  });

  // Session وجود ندارد
  if (!session) {
    return null;
  }

  // Session منقضی شده
  if (session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}
