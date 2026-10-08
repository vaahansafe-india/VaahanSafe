"use client";
import { useCallback, useEffect, useState } from "react";

type Channels = { SMS: boolean; WHATSAPP: boolean };
const unavailable: Channels = { SMS: false, WHATSAPP: false };
/** Reads server configuration only. UI availability never authorizes delivery. */
export function useOtpAvailability(endpoint: string) {
  const [channels, setChannels] = useState<Channels>(unavailable);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error("Availability unavailable");
      const data = await response.json();
      setChannels({ SMS: data.channels?.SMS === true, WHATSAPP: data.channels?.WHATSAPP === true });
    } catch { setChannels(unavailable); }
    finally { setLoading(false); }
  }, [endpoint]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { channels, loading, refresh, anyAvailable: channels.SMS || channels.WHATSAPP };
}
