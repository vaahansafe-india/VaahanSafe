import React from "react";
import { ResolverShell } from "../components/shell/ResolverShell";
import { UnknownQrState } from "../components/states/UnknownQrState";

export default function QrNotFoundPage() {
  return (
    <ResolverShell>
      <UnknownQrState />
    </ResolverShell>
  );
}
