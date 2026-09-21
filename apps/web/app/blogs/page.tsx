import { redirect } from "next/navigation";

/**
 * Plural alias redirect: /blogs -> /blog
 */
export default function BlogsAliasPage() {
  redirect("/blog");
}
