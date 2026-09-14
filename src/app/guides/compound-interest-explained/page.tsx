import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RelatedLinks } from "@/components/shared/RelatedLinks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "What compound interest is, how monthly compounding actually works month by month, and a worked example you can check by hand.";
const path = "/guides/compound-interest-explained";

export const metadata: Metadata = {
  title: "Compound Interest Explained",
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "Compound Interest Explained",
    description,
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary",
    title: "Compound Interest Explained",
    description,
  },
};

const breadcrumbItems = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Compound interest explained", path },
];

export default function CompoundInterestGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbListSchema(breadcrumbItems)} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides" },
          { name: "Compound interest explained" },
        ]}
      />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Compound interest explained
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        Compound interest is interest calculated on a balance that already
        includes interest from earlier periods, so the amount you earn each
        period grows on top of itself rather than staying flat. This guide
        walks through exactly how that works one month at a time, with a
        worked example you can check by hand.
      </p>

      <div className="space-y-10 text-navy-soft">
        <section aria-labelledby="what-is-heading">
          <h2 id="what-is-heading" className="mb-3 text-xl font-semibold text-navy">
            What makes it &ldquo;compound&rdquo;
          </h2>
          <p className="mb-3">
            Simple interest pays you the same dollar amount every period,
            because it is always calculated on the original balance. Compound
            interest instead calculates each period&apos;s interest on the
            current balance, which already includes every prior
            period&apos;s interest. That current balance grows a little each
            period, so the next period&apos;s interest is calculated on a
            slightly larger number, and so on.
          </p>
          <p>
            The practical effect: over a short period the difference between
            simple and compound interest is small, but over many periods it
            compounds, meaning the gap widens faster than a straight line
            would suggest. The&nbsp;
            <Link href="/calculators/compound-interest" className="text-teal-dark underline hover:text-teal">
              compound interest calculator
            </Link>
            {" "}projects this month by month so you can see the actual
            numbers rather than estimate them.
          </p>
        </section>

        <section aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="mb-3 text-xl font-semibold text-navy">
            How monthly compounding works, step by step
          </h2>
          <p className="mb-3">
            For a nominal annual rate, the monthly rate used in the
            calculation is the annual rate divided by 12. Let <code>B</code>{" "}
            be the balance at the start of a month and <code>i</code> be that
            monthly rate. With no contribution, one month&apos;s step is:
          </p>
          <div className="mb-3 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>B_next = B &times; (1 + i)</p>
          </div>
          <p>
            That step repeats once per month. Each month&apos;s starting
            balance is the previous month&apos;s ending balance, which is
            exactly what makes the growth compound rather than stay flat.
            High precision arithmetic keeps this exact over long schedules,
            since rounding a small amount every single month would otherwise
            quietly lose or add money over years of compounding.
          </p>
        </section>

        <section aria-labelledby="worked-example-heading">
          <h2 id="worked-example-heading" className="mb-3 text-xl font-semibold text-navy">
            Worked example
          </h2>
          <p className="mb-3">
            Start with a balance of $5,000, a nominal annual rate of 5%
            (monthly rate <code>i = 0.05 / 12</code>), no monthly
            contribution, over 10 years (120 months):
          </p>
          <div className="mb-3 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>Final balance = 5,000 &times; (1 + 0.05/12)^120</p>
          </div>
          <p className="mb-3">
            Working that out gives a final balance of{" "}
            <strong className="text-navy">$8,235.05</strong>, meaning the
            original $5,000 earned about $3,235.05 in interest over the 10
            years, entirely from compounding since there were no
            contributions. You can reproduce this exact scenario on the{" "}
            <Link href="/calculators/compound-interest" className="text-teal-dark underline hover:text-teal">
              compound interest calculator
            </Link>
            : enter a starting balance of $5,000, a nominal annual rate of
            5%, a monthly contribution of $0, and a duration of 120 months.
          </p>
          <p>
            Compare that to simple interest on the same $5,000 at 5% a year
            for 10 years, which would only pay 5,000 &times; 0.05 &times; 10
            = $2,500 in interest, a straight line with no compounding. The
            extra $735.05 in the compound example comes entirely from each
            month&apos;s interest earning further interest in later months.
          </p>
        </section>

        <section aria-labelledby="assumptions-heading">
          <h2 id="assumptions-heading" className="mb-3 text-xl font-semibold text-navy">
            Assumptions and limitations
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>The rate is assumed constant for the whole period; real rates can change.</li>
            <li>Only monthly compounding is covered here; other compounding frequencies would give a different result.</li>
            <li>This does not include taxes on interest earned, account or fund fees, or inflation.</li>
            <li>A nominal annual rate is not the same as an APY; see the separate guide on that difference below if your rate is quoted as an APY.</li>
          </ul>
        </section>

        <section aria-labelledby="disclaimer-heading">
          <h2 id="disclaimer-heading" className="mb-3 text-xl font-semibold text-navy">
            Educational disclaimer
          </h2>
          <p>
            This guide is for education only and is not individualized
            financial, tax, or investment advice. It does not recommend any
            specific rate, account, or provider. See the{" "}
            <Link href="/methodology" className="text-teal-dark underline hover:text-teal">
              methodology page
            </Link>{" "}
            for the full list of what every calculator on this site does and
            does not model.
          </p>
        </section>
      </div>

      <RelatedLinks
        links={[
          { href: "/calculators/compound-interest", label: "Compound interest calculator" },
          { href: "/calculators/savings-goal", label: "Savings goal calculator" },
          { href: "/guides/nominal-interest-rate-vs-apy", label: "Guide: nominal interest rate versus APY" },
        ]}
      />
    </div>
  );
}
