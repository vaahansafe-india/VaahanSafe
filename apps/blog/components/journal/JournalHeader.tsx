import { getWebUrl } from "@vaahansafe/config";
import { JournalHeaderClient } from "./JournalHeaderClient";

export function JournalHeader() {
  return <JournalHeaderClient webUrl={getWebUrl()} />;
}
