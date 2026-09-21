import { VaahanIcon } from "@vaahansafe/icons";
import {
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@vaahansafe/ui/components";

export function FaqPreview() {
  const faqs = [
    {
      id: "faq-1",
      question: "Does a finder need to download an app or create an account to scan my QR?",
      answer:
        "No. Any bystander, traffic warden, or first responder can simply point their native smartphone camera (iOS, Android, KaiOS) at your VaahanSafe sticker. It opens an instant web view at qr.vaahansafe.com without requiring an account, app install, or payment.",
    },
    {
      id: "faq-2",
      question: "Will strangers be able to see my home address or personal mobile number?",
      answer:
        "Never. Your home address, registration certificate scans, and primary account email are permanently restricted to your private owner vault. Voice calls and SMS alerts are bridged through secure privacy-masked relays so your real phone number is never exposed.",
    },
    {
      id: "faq-3",
      question: "How does the retail scratch card activation work?",
      answer:
        "When purchasing a physical VaahanSafe kit from an authorized automotive retailer, you receive a tamper-evident package. You scan the permanent QR code, scratch off the silver security foil to reveal your single-use activation secret, and pair the sticker with your vehicle in under two minutes at activate.vaahansafe.com.",
    },
    {
      id: "faq-4",
      question: "What happens if my car windshield breaks or my sticker gets damaged?",
      answer:
        "You can request an instant replacement directly from your garage console at app.vaahansafe.com. A brand-new hardware sticker is dispatched to your doorstep. As soon as you confirm, the damaged QR is retired into a safe 'REPLACED' state where zero private data is leaked, while your vehicle details and emergency contacts seamlessly transfer to the new tag.",
    },
    {
      id: "faq-5",
      question: "Can I manage multiple vehicles under a single VaahanSafe account?",
      answer:
        "Yes. Your customer garage supports multiple cars, two-wheelers, and commercial vehicles. Each vehicle possesses its own physical QR tag and independent privacy controls, allowing you to configure different emergency contacts (e.g., spouse for personal car, transport manager for fleet truck).",
    },
    {
      id: "faq-6",
      question: "Does the VaahanSafe sticker require an active battery or SIM card in my vehicle?",
      answer:
        "No. The physical sticker is a high-contrast passive optical identifier manufactured from automotive-grade UV-stabilized polymer. It requires zero vehicle battery power, zero SIM cards, and zero GPS tracking hardware, meaning it remains 100% operational even if your car's battery is completely dead or disconnected.",
    },
  ];

  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-background relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 md:mb-16">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Clear Product Answers
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Everything you need to know about physical stickers, emergency privacy,
            and our decoupled edge architecture.
          </p>
        </div>

        {/* Accordion List */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-border/60">
                <AccordionTrigger className="text-left font-semibold text-base sm:text-lg text-foreground hover:no-underline hover:text-primary py-5">
                  <span className="flex items-center gap-3">
                    <VaahanIcon name="help" size={18} className="text-primary shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pl-8 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still Have Questions Bar */}
        <div className="mt-10 text-center text-xs sm:text-sm text-muted-foreground">
          <span>Have a specific fleet or installation question? </span>
          <a
            href="mailto:support@vaahansafe.com"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            Contact VaahanSafe Safety Support
            <VaahanIcon name="external-link" size={13} className="opacity-70" />
          </a>
        </div>
      </div>
    </section>
  );
}
