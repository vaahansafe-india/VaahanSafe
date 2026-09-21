"use client";

import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@vaahansafe/ui/components";

export function QrFaq() {
  const faqs = [
    {
      id: "faq-1",
      question: "What happens when someone scans my VaahanSafe QR?",
      answer:
        "The person's phone opens https://qr.vaahansafe.com/{publicId} directly in their web browser. Our edge servers verify that the sticker is active and render only the emergency contacts, blood group, and safety notes you have explicitly authorized.",
    },
    {
      id: "faq-2",
      question: "Does someone need a VaahanSafe account or app to scan it?",
      answer:
        "No. Any modern smartphone camera (iOS or Android) can scan the QR code and view the active safety profile instantly. No app installation, user login, or registration is required to view an active pass.",
    },
    {
      id: "faq-3",
      question: "Can a scanner see my complete personal account or address?",
      answer:
        "Never. Your residential address, personal email, payment details, and complete user account remain strictly secured behind server-side projection. Only the specific emergency fields you designate as public are ever transmitted to the scanner.",
    },
    {
      id: "faq-4",
      question: "What if my QR sticker has not yet been activated?",
      answer:
        "If an unactivated sticker is scanned, our system displays a 'Ready to Activate' notice and directs the visitor to https://activate.vaahansafe.com. No personal or vehicle information exists or can be accessed until activation is completed by the rightful owner.",
    },
    {
      id: "faq-5",
      question: "What happens when a QR sticker is replaced?",
      answer:
        "If a physical sticker is damaged or peeled off, you can bind a replacement sticker in your account. The old QR code is immediately marked 'REPLACED' and automatically routes visitors to the new active identity pass.",
    },
    {
      id: "faq-6",
      question: "Can I change what is shown publicly at any time?",
      answer:
        "Yes. From your VaahanSafe customer dashboard, you can toggle your display name, blood group, medical notes, or emergency contacts on or off at any moment. Changes take effect instantly upon saving.",
    },
    {
      id: "faq-7",
      question: "Does VaahanSafe replace official emergency services?",
      answer:
        "No. VaahanSafe is an emergency identification and citizen contact relay. In life-threatening emergencies, bystanders and responders must always dial official services like 112 (National Emergency) or 108 (Ambulance).",
    },
    {
      id: "faq-8",
      question: "What happens if a scanner has poor network connectivity?",
      answer:
        "Our resolver runtime is engineered for high performance with minimal payloads (under 200KB). If a user's mobile device loses signal after loading, an offline banner alerts them while preserving already-rendered emergency numbers.",
    },
  ];

  return (
    <section id="faq" className="w-full py-16 sm:py-24 border-b border-border/80 bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary font-semibold">
            <span>08</span>
            <span>&bull;</span>
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.15]">
            Everything you need to know <br />
            about <span className="italic text-primary font-medium">VaahanSafe QR.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Real product policy, privacy guarantees, and technical clarity.
          </p>
        </div>

        {/* Accessible Accordion */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-8 shadow-xs">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-b border-border/60 last:border-none py-1"
              >
                <AccordionTrigger className="text-left font-serif text-base sm:text-lg font-medium text-foreground hover:no-underline hover:text-primary transition-colors py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
