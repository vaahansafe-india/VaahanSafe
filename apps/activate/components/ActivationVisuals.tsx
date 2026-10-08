import Image from "next/image";
import type { ActivationStage } from "@/lib/types";

const ARTWORK = {
  proof: "/images/activation-proof-paper.webp",
  mobile: "/images/activation-mobile-paper.webp",
  vehicle: "/images/activation-vehicle-paper.webp",
} as const;

const GUIDE = [
  {
    key: "proof",
    number: "01",
    title: "Your sticker. Your proof.",
    description: "Keep your QR sticker and scratch code together. The protected code verifies possession of your kit.",
  },
  {
    key: "mobile",
    number: "02",
    title: "A verified connection.",
    description: "Confirm your mobile with a secure OTP so the connection belongs to your verified account.",
  },
  {
    key: "vehicle",
    number: "03",
    title: "Connected to your vehicle.",
    description: "Choose a vehicle you own and review the details. Services become available after the server confirms activation.",
  },
] as const;

export function ActivationStageArtwork({ stage }: { stage: ActivationStage }) {
  const key = stage === "IDENTITY"
    ? "mobile"
    : stage === "VEHICLE" || stage === "REVIEW" || stage === "ACTIVE"
      ? "vehicle"
      : "proof";

  return (
    <div className="activation-stage-artwork" aria-hidden="true">
      <Image src={ARTWORK[key]} alt="" width={720} height={480} sizes="(max-width: 860px) 180px, 260px" />
    </div>
  );
}

export function ActivationVisualGuide() {
  return (
    <section className="activation-visual-guide" aria-labelledby="activation-guide-title">
      <div className="activation-guide-heading">
        <p className="activation-kicker">Made for a safer connection</p>
        <h2 id="activation-guide-title">Three checks.<br /><em>One secure connection.</em></h2>
        <p>Have your kit, mobile, and vehicle details ready. We’ll guide you through each check.</p>
      </div>
      <div className="activation-guide-grid">
        {GUIDE.map((item) => (
          <article className="activation-guide-card" key={item.key}>
            <div className="activation-guide-image" aria-hidden="true">
              <Image src={ARTWORK[item.key]} alt="" width={720} height={480} sizes="(max-width: 640px) 120px, (max-width: 860px) 30vw, 380px" />
            </div>
            <div className="activation-guide-copy">
              <span className="activation-kicker">{item.number} / Ready to connect</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
