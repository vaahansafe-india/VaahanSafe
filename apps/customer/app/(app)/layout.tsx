import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "../../lib/session";
import { CustomerQueryProvider } from "@/components/query/CustomerQueryProvider";
import { CustomerQueryShell } from "@/components/query/CustomerQueryShell";

export default async function AuthenticatedCustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const { user } = auth;

  const scope = `${user.id}:${auth.session.id}`;
  return (
    <CustomerQueryProvider key={scope} scope={scope}><CustomerQueryShell
      userName={user.name}
      userPhone={user.phone}
      userEmail={user.email}
      phoneVerified={auth.phoneVerified}
      googleVerified={auth.googleVerified}
    >
      {children}
    </CustomerQueryShell></CustomerQueryProvider>
  );
}
