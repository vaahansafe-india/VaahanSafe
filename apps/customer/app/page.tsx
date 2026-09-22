import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "../lib/session";

export default async function CustomerRootPage() {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  redirect("/dashboard");
}

