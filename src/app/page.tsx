import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-teal-dark">
        Free financial calculators
      </p>
      <h1 className="mb-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
        {siteConfig.tagline}
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-navy-soft">
        {siteConfig.name} is a set of straightforward calculators for everyday
        savings questions. Everything runs in your browser, and nothing you
        type is sent anywhere, stored, or required for you to log in.
      </p>
      <div className="mb-10 flex flex-wrap gap-3">
        <Link
          href="/calculators/compound-interest"
          className="rounded-md bg-teal px-5 py-3 font-medium text-white hover:bg-teal-dark"
        >
          Try the compound interest calculator
        </Link>
        <Link
          href="/calculators"
          className="rounded-md border border-border px-5 py-3 font-medium text-navy hover:border-teal"
        >
          See all calculators
        </Link>
      </div>

      <div className="mb-10 grid gap-4 border-t border-border pt-10 sm:grid-cols-2">
        <Link
          href="/calculators/compound-interest"
          className="rounded-lg border border-border bg-surface p-4 hover:border-teal"
        >
          <h2 className="mb-1 font-semibold text-navy">Compound interest</h2>
          <p className="text-sm text-navy-soft">See how a balance could grow over time.</p>
        </Link>
        <Link
          href="/calculators/savings-goal"
          className="rounded-lg border border-border bg-surface p-4 hover:border-teal"
        >
          <h2 className="mb-1 font-semibold text-navy">Savings goal</h2>
          <p className="text-sm text-navy-soft">How much do I need to save each month?</p>
        </Link>
        <Link
          href="/calculators/savings-time"
          className="rounded-lg border border-border bg-surface p-4 hover:border-teal"
        >
          <h2 className="mb-1 font-semibold text-navy">Savings time</h2>
          <p className="text-sm text-navy-soft">How long will it take to reach my target?</p>
        </Link>
        <Link
          href="/calculators/savings-comparison"
          className="rounded-lg border border-border bg-surface p-4 hover:border-teal"
        >
          <h2 className="mb-1 font-semibold text-navy">Savings comparison</h2>
          <p className="text-sm text-navy-soft">What changes if I save more or use a different rate?</p>
        </Link>
      </div>

      <div className="grid gap-6 border-t border-border pt-10 sm:grid-cols-3">
        <div>
          <h2 className="mb-1 font-semibold text-navy">No login required</h2>
          <p className="text-sm text-navy-soft">
            Use any calculator immediately. No account, no email address.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-navy">Nothing leaves your device</h2>
          <p className="text-sm text-navy-soft">
            Calculations happen locally in your browser using standard
            arithmetic. Not a database, and not an AI model.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-navy">Show your work</h2>
          <p className="text-sm text-navy-soft">
            Every result comes with the formula and assumptions behind it, so
            you can check the math yourself.
          </p>
        </div>
      </div>
    </div>
  );
}
