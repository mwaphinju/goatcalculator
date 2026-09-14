import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "Plain-language guides explaining the math behind GOAT Calculator's tools, each with a worked example and a link to the relevant calculator.";

export const metadata: Metadata = {
  title: "Guides",
  description,
  alternates: {
    canonical: absoluteUrl("/guides"),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "Guides",
    description,
    url: absoluteUrl("/guides"),
  },
  twitter: {
    card: "summary",
    title: "Guides",
    description,
  },
};

const breadcrumbItems = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
];

const guides = [
  {
    href: "/guides/compound-interest-explained",
    title: "Compound interest explained",
    description: "What compound interest is, how monthly compounding works, and a worked example.",
  },
  {
    href: "/guides/how-to-calculate-a-savings-goal",
    title: "How to calculate a savings goal",
    description: "How to work out the monthly contribution needed to reach a target balance.",
  },
  {
    href: "/guides/how-extra-loan-payments-work",
    title: "How extra loan payments work",
    description: "Why extra payments shorten a loan and reduce interest, with a worked example.",
  },
  {
    href: "/guides/nominal-interest-rate-vs-apy",
    title: "Nominal interest rate versus APY",
    description: "The difference between a nominal annual rate and an APY, and why it matters.",
  },
  {
    href: "/guides/inflation-and-buying-power",
    title: "Inflation and buying power",
    description: "How inflation affects what a future balance can actually buy.",
  },
];

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbListSchema(breadcrumbItems)} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Guides" }]} />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">Guides</h1>
      <p className="mb-8 max-w-xl text-navy-soft">
        Plain-language explanations of the math behind these calculators,
        each with an independently checked worked example and a link to
        the relevant tool. These are educational guides, not individualized
        financial advice.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <li key={guide.href}>
            <Link
              href={guide.href}
              className="block rounded-lg border border-border bg-surface p-5 hover:border-teal"
            >
              <h2 className="mb-1 font-semibold text-navy">{guide.title}</h2>
              <p className="text-sm text-navy-soft">{guide.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
