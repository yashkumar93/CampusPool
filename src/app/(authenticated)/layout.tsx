import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardTopBar } from "@/components/DashboardTopBar";

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
    <div className="flex min-h-screen bg-black text-white dark shopify-scope">
      <AppSidebar />
      <div className="flex-1 flex flex-col ml-60">
        <DashboardTopBar />
        <main className="flex-1 px-6 py-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
