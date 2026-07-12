import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
    </div>
  );
}
