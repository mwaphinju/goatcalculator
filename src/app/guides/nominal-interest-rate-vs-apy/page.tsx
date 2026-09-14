import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RelatedLinks } from "@/components/shared/RelatedLinks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "The difference between a nominal annual interest rate and an APY, why entering one as the other gives a different answer, and a worked example.";
const path = "/guides/nominal-interest-rate-vs-apy";

export const metadata: Metadata = {
  title: "Nominal Interest Rate vs APY",
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "Nominal Interest Rate vs APY",
    description,
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary",
    title: "Nominal Interest Rate vs APY",
    description,
  },
};

const breadcrumbItems = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Nominal interest rate versus APY", path },
];

export default function NominalVsApyGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbListSchema(breadcrumbItems)} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides" },
          { name: "Nominal interest rate versus APY" },
        ]}
      />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Nominal interest rate versus APY
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        A nominal annual rate and an APY (annual percentage yield) can share
        the same number, such as 6%, and still describe different amounts
        of actual growth. This guide explains why, and shows the numeric
        difference with a worked example.
      </p>

      <div className="space-y-10 text-navy-soft">
        <section aria-labelledby="difference-heading">
          <h2 id="difference-heading" className="mb-3 text-xl font-semibold text-navy">
            What the two terms mean
          </h2>
          <p className="mb-3">
            A nominal annual rate has not yet had compounding applied to it.
            To use it in a monthly calculation, it is divided by 12 to get a
            monthly rate, and that monthly rate is what actually compounds
            over the year. An APY is already an effective annual rate: it
            already accounts for whatever compounding produced it, so
            converting it to a monthly rate means finding the single monthly
            rate that, compounded 12 times, reproduces that same APY exactly,
            not dividing it by 12.
          </p>
          <p>
            Entering the same number in the wrong mode gives a different,
            less accurate answer, because a nominal rate divided by 12 and
            then compounded monthly always produces slightly more growth
            over a year than that same number used directly as an APY.
          </p>
        </section>

        <section aria-labelledby="formula-heading">
          <h2 id="formula-heading" className="mb-3 text-xl font-semibold text-navy">
            The two conversions
          </h2>
          <div className="mb-3 space-y-1 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>Nominal annual rate: i = rate / 100 / 12</p>
            <p>APY: i = (1 + APY / 100)^(1 / 12) &minus; 1</p>
          </div>
          <p>
            Neither path compounds the other again on top: a nominal rate is
            divided, not exponentiated; an APY is exponentiated, not
            divided.
          </p>
        </section>

        <section aria-labelledby="worked-example-heading">
          <h2 id="worked-example-heading" className="mb-3 text-xl font-semibold text-navy">
            Worked example
          </h2>
          <p className="mb-3">
            $10,000 over 12 months at 6%, compared under each interpretation:
          </p>
          <div className="overflow-x-auto">
            <table className="mb-3 w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-1 pr-4 font-medium text-navy">Interpretation</th>
                  <th className="py-1 pr-4 font-medium text-navy">Monthly rate</th>
                  <th className="py-1 font-medium text-navy">Balance after 12 months</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-1 pr-4">6% nominal annual rate</td>
                  <td className="py-1 pr-4">0.5% (6 / 100 / 12)</td>
                  <td className="py-1">$10,616.78</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">6% APY</td>
                  <td className="py-1 pr-4">&asymp; 0.486755%</td>
                  <td className="py-1">$10,600.00</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-3">
            The nominal reading grows to <strong className="text-navy">$10,616.78</strong>, $16.78
            more than the APY reading&apos;s exact <strong className="text-navy">$10,600.00</strong>.
            That is because a 6% nominal annual rate compounded monthly is
            actually equivalent to an APY of about 6.1678%, not 6%. The APY
            reading, by definition, lands on exactly 6% growth for the year:
            $10,000 &times; 1.06 = $10,600.00.
          </p>
          <p>
            The{" "}
            <Link href="/calculators/savings-goal" className="text-teal-dark underline hover:text-teal">
              savings goal
            </Link>
            ,{" "}
            <Link href="/calculators/savings-time" className="text-teal-dark underline hover:text-teal">
              savings time
            </Link>
            , and{" "}
            <Link href="/calculators/savings-comparison" className="text-teal-dark underline hover:text-teal">
              savings comparison
            </Link>{" "}
            calculators let you choose which interpretation your rate is,
            so you can enter the number exactly as quoted rather than
            guessing which conversion applies.
          </p>
        </section>

        <section aria-labelledby="assumptions-heading">
          <h2 id="assumptions-heading" className="mb-3 text-xl font-semibold text-navy">
            Assumptions and limitations
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>This assumes monthly compounding; other compounding frequencies would change the conversion.</li>
            <li>It does not tell you which interpretation a specific real account, product, or offer actually uses; that depends on how the rate was quoted to you.</li>
            <li>It does not include taxes, fees, or inflation.</li>
          </ul>
        </section>

        <section aria-labelledby="disclaimer-heading">
          <h2 id="disclaimer-heading" className="mb-3 text-xl font-semibold text-navy">
            Educational disclaimer
          </h2>
          <p>
            This guide is for education only and is not individualized
            financial advice. It does not recommend any specific rate,
            account, or provider. See the{" "}
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
          { href: "/calculators/savings-goal", label: "Savings goal calculator" },
          { href: "/calculators/savings-time", label: "Savings time calculator" },
          { href: "/calculators/savings-comparison", label: "Savings comparison calculator" },
        ]}
      />
    </div>
  );
}
