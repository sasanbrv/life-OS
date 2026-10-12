
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      { message: "Not authenticated." },
      { status: 401 }
    );
  }

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
