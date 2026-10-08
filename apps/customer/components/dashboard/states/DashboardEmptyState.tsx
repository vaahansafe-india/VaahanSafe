import { CustomerLink as Link } from "@/components/query/CustomerLink";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Badge,
} from "@vaahansafe/ui";
import { Button } from "@/components/ui/button";

const steps: {
  icon: VaahanIconName;
  label: string;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: string;
}[] = [
  {
    icon: "vehicle",
    label: "01 / Vehicle",
    title: "Start with your vehicle",
    description: "Add your registration number and vehicle details.",
    href: "/vehicles/new",
    action: "Add vehicle",
    tone: "bg-[#f3e5da] text-[#a9583e]",
  },
  {
    icon: "users",
    label: "02 / Contacts",
    title: "Choose who to contact",
    description:
      "Choose the people to reach when your vehicle needs attention.",
    href: "/emergency-contacts",
    action: "Manage contacts",
    tone: "bg-[#e3edeb] text-[#325763]",
  },
  {
    icon: "qr",
    label: "03 / QR identity",
    title: "Connect your QR",
    description: "Purchase a sticker or activate your retail QR.",
    href: "/qr",
    action: "Explore QR options",
    tone: "bg-[#ece7db] text-[#756143]",
  },
];

export function DashboardEmptyState() {
  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto py-6 sm:py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Badge
          variant="outline"
          className="gap-2 border-[#d8d0c5] bg-[#faf9f5]/70 px-3 py-1.5 font-normal text-[#615f59]"
        >
          <VaahanIcon name="dashboard" size={14} />
          Your account / Overview
        </Badge>
        <h1 className="mt-5 text-center">
          Your journey,
          <br />
          <em className="text-[#a9583e]">all in one place.</em>
        </h1>
        <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
          You haven&apos;t added a vehicle yet. Add your vehicle to manage its safety
          details, emergency contacts and QR identity.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 bg-[#252320] px-5 text-[#faf9f5] hover:bg-[#3a3833]"
          >
            <Link href="/vehicles/new">
              <VaahanIcon name="plus" size={18} />
              Add your first vehicle
              <VaahanIcon name="arrow-right" size={16} />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 gap-2 bg-[#faf9f5]/60 px-5"
          >
            <Link href="/qr/activate">
              <VaahanIcon name="qr-scan" size={18} />
              Activate a retail QR
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-10 sm:mt-12 grid w-full gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card
            key={step.label}
            className="flex flex-col border-[#d8d0c5] bg-[#faf9f5]/80 transition-colors hover:border-[#b59680]"
          >
            <CardHeader className="flex-1 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span
                  className={`flex size-12 items-center justify-center rounded-xl ${step.tone}`}
                >
                  <VaahanIcon name={step.icon} size={26} strokeWidth={1.7} />
                </span>
                <span className="paper-label">{step.label}</span>
              </div>
              <CardTitle className="font-serif text-2xl font-medium leading-tight">
                {step.title}
              </CardTitle>
              <CardDescription className="!mt-3 leading-relaxed">
                {step.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-5 pt-0 sm:p-6 sm:pt-0">
              <Button
                asChild
                variant="ghost"
                className="h-10 w-full justify-between border border-[#e2dcd2] bg-[#f3eee5]/70 px-3 text-[#a9583e]"
              >
                <Link href={step.href}>
                  {step.action}
                  <VaahanIcon name="arrow-right" size={16} />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
