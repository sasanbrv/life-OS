
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/app/components/Sidebar";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#080D1B] text-white">
      <Sidebar userName={user.name} />

      <main className="min-h-screen px-5 pb-8 pt-24 sm:px-8 lg:ml-64 lg:pt-8">
        {children}
      </main>
    </div>
  );
}

