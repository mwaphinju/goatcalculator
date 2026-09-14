import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RelatedLinks } from "@/components/shared/RelatedLinks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "How inflation reduces what a future account balance can actually buy, the formula used to estimate buying power in today's money, and a worked example.";
const path = "/guides/inflation-and-buying-power";

export const metadata: Metadata = {
  title: "Inflation and Buying Power",
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "Inflation and Buying Power",
    description,
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary",
    title: "Inflation and Buying Power",
    description,
  },
};

const breadcrumbItems = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Inflation and buying power", path },
];

export default function InflationGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbListSchema(breadcrumbItems)} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides" },
          { name: "Inflation and buying power" },
        ]}
      />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Inflation and buying power
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        A future account balance and what that balance can actually buy are
        two different numbers once inflation is taken into account. This
        guide explains the distinction and shows how to estimate a future
        balance&apos;s buying power in today&apos;s money.
      </p>

      <div className="space-y-10 text-navy-soft">
        <section aria-labelledby="distinction-heading">
          <h2 id="distinction-heading" className="mb-3 text-xl font-semibold text-navy">
            Two different numbers
          </h2>
          <p className="mb-3">
            Inflation is the general rise in prices over time, which means a
            fixed amount of money buys a little less each year than it did
            the year before. This has nothing to do with how an account
            balance is projected to grow: the account balance itself is not
            reduced by inflation, and inflation is never used to change a
            projected balance in these calculators. Instead, inflation is
            used separately, only to estimate what that same future balance
            would be worth if you measured it in today&apos;s prices
            instead of future prices.
          </p>
          <p>
            Put another way: the balance answers &ldquo;how many dollars
            will I have,&rdquo; while buying power answers &ldquo;how much
            could that many future dollars actually buy, compared to what
            today&apos;s dollars can buy.&rdquo; Those are genuinely
            different questions with different answers.
          </p>
        </section>

        <section aria-labelledby="formula-heading">
          <h2 id="formula-heading" className="mb-3 text-xl font-semibold text-navy">
            The formula
          </h2>
          <p className="mb-3">
            Given a final balance, an assumed annual inflation rate, and a
            duration in months:
          </p>
          <div className="mb-3 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>Estimated buying power = final balance / (1 + annual inflation rate / 100)^(duration in months / 12)</p>
          </div>
          <p>
            A 0% inflation rate leaves buying power equal to the final
            balance exactly, since dividing by 1 changes nothing. Any
            positive inflation rate reduces the estimated buying power
            below the nominal balance, and the reduction grows the longer
            the time horizon is.
          </p>
        </section>

        <section aria-labelledby="worked-example-heading">
          <h2 id="worked-example-heading" className="mb-3 text-xl font-semibold text-navy">
            Worked example
          </h2>
          <p className="mb-3">
            A projected final balance of $50,000, 20 years from now, with an
            assumed 3% annual inflation rate:
          </p>
          <div className="mb-3 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>Estimated buying power = 50,000 / (1.03)^20</p>
          </div>
          <p className="mb-3">
            That works out to an estimated buying power of{" "}
            <strong className="text-navy">$27,683.79</strong> in
            today&apos;s money, meaning $50,000 received 20 years from now,
            under a steady 3% annual inflation assumption, would be able to
            buy roughly what $27,683.79 buys today. At a shorter 10 year
            horizon under the same 3% assumption, the same $50,000 balance
            would have an estimated buying power of $37,204.70, since
            inflation has had less time to compound.
          </p>
          <p>
            The{" "}
            <Link href="/calculators/savings-scenarios" className="text-teal-dark underline hover:text-teal">
              savings scenario calculator
            </Link>{" "}
            calculates this for every scenario you enter, alongside the
            projected balance itself, using whatever inflation assumption
            you choose.
          </p>
        </section>

        <section aria-labelledby="assumptions-heading">
          <h2 id="assumptions-heading" className="mb-3 text-xl font-semibold text-navy">
            Assumptions and limitations
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>The inflation rate is assumed constant for the whole period; real inflation varies year to year.</li>
            <li>This does not predict what inflation will actually be; the rate is an assumption you choose, not a forecast.</li>
            <li>This does not include taxes, account or fund fees, or the possibility that the underlying growth rate also changes over time.</li>
          </ul>
        </section>

        <section aria-labelledby="disclaimer-heading">
          <h2 id="disclaimer-heading" className="mb-3 text-xl font-semibold text-navy">
            Educational disclaimer
          </h2>
          <p>
            This guide is for education only and is not individualized
            financial advice. It does not state or imply what inflation
            will actually be in the future. See the{" "}
            <Link href="/methodology" className="text-teal-dark underline hover:text-teal">
              methodology page
            </Link>{" "}
            for the full list of what every calculator on this site does and
            does not model.
          </p>
        </section>
      </div>

      <RelatedLinks
        links={[{ href: "/calculators/savings-scenarios", label: "Savings scenario calculator" }]}
      />
    </div>
  );
}
