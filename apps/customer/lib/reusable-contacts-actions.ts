"use server";

import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "./session";
import { getReusableContacts } from "./reusable-contacts";
import type { ReusableSafetyContact } from "./contacts-types";

export async function getReusableContactsAction(): Promise<{
  contacts?: ReusableSafetyContact[];
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth?.phoneVerified)
      return {
        error:
          "Please sign in with your verified mobile to choose saved contacts.",
      };
    return {
      contacts: await getReusableContacts(
        getAuthoritativeDatabaseClient(),
        auth.user.id,
      ),
    };
  } catch {
    console.warn("[Safety contacts] Saved contacts unavailable");
    return {
      error:
        "We couldn’t load your saved contacts. Retry or enter the contact details below.",
    };
  }
}
