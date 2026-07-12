import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import { AuthForm } from "./AuthForm";

export default async function AuthPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/home");
  }

  return <AuthForm />;
}
