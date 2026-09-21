import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@vaahansafe/auth";

export default async function CustomerRootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;

  if (!session) {
    redirect("/login");
  }

  redirect("/dashboard");
}
