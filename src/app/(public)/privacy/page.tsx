import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – Tamworth Squash Ladder",
  description: "How Tamworth Squash Ladder collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-500 mt-1">
          How we collect, use, and protect your personal data.
        </p>
        <p className="text-xs text-gray-400 mt-2">Last updated: May 2026</p>
      </div>

      {/* Who we are */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Who we are</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          This application is independently built and operated by the site owner
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). It is not owned or operated
          by Tamworth Squash Club. The site owner acts as the data controller responsible for
          personal information collected through this website.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          This policy applies to personal data collected when you create an account, use the
          ladder, or otherwise interact with this application.
        </p>
      </section>

      {/* What we collect */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">What personal data we collect</h2>
        <ul className="space-y-2.5 text-sm text-gray-600">
          {[
            {
              label: "Name and email address",
              detail:
                "Collected when you create an account. Required to log in and receive notifications.",
            },
            {
              label: "Password",
              detail:
                "Stored as a one-way cryptographic hash. We cannot read your password — only verify it.",
            },
            {
              label: "Phone number",
              detail:
                "Optional. You may enter this in your profile settings. If provided, it is visible to other active ladder members to help arrange matches.",
            },
            {
              label: "Ladder activity",
              detail:
                "Challenges issued and received, match results, scores, rank history, and any notes added to matches.",
            },
            {
              label: "Court bookings",
              detail:
                "Court number, date, and time of any courts booked through the app.",
            },
            {
              label: "Profile photo",
              detail:
                "Optional. Uploaded by you and displayed on your profile.",
            },
          ].map(({ label, detail }) => (
            <li key={label} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                ✓
              </span>
              <span>
                <span className="font-medium text-gray-700">{label}</span>
                {" — "}
                {detail}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500 pt-1">
          We do not collect payment card data, government IDs, health information, or any other
          sensitive categories of personal data.
        </p>
      </section>

      {/* Why / legal basis */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Why we collect it</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          We collect and use your personal data for the following purposes:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            "To create and manage your account.",
            "To authenticate you when you sign in.",
            "To send you account verification and password-related emails.",
            "To notify you about ladder challenges and results.",
            "To display your name, rank, and optional contact details to other active ladder members so matches can be arranged.",
            "To record ladder standings, match history, and rank changes.",
            "To manage court bookings you make through the app.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 text-brand-500 font-bold flex-shrink-0">–</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Who we share with */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Who we share your data with</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          We do not sell your personal data. We share it only with the following third-party
          services that are necessary to run the application:
        </p>
        <div className="space-y-3">
          {[
            {
              name: "Vercel",
              role: "Hosting and infrastructure",
              detail:
                "Hosts the application and processes web requests. Data may be processed on servers in the United States.",
              href: "https://vercel.com/legal/privacy-policy",
            },
            {
              name: "Neon",
              role: "Database",
              detail:
                "Stores all application data including your account details, ladder records, and bookings.",
              href: "https://neon.tech/privacy",
            },
            {
              name: "Resend",
              role: "Email delivery",
              detail:
                "Sends account verification emails and ladder notifications to the email address you registered with.",
              href: "https://resend.com/legal/privacy-policy",
            },
          ].map(({ name, role, detail, href }) => (
            <div
              key={name}
              className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-1"
            >
              <p className="text-sm font-semibold text-gray-800">
                {name}{" "}
                <span className="text-xs font-normal text-gray-500">— {role}</span>
              </p>
              <p className="text-sm text-gray-600">{detail}</p>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline"
              >
                {name} Privacy Policy ↗
              </a>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed pt-1">
          Your contact details (email and phone, if provided) are also visible to other{" "}
          <strong>active ladder members only</strong> on the Standings page, to help arrange
          matches. You can hide your phone number and email from the Standings page in your
          profile settings.
        </p>
      </section>

      {/* How long */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">How long we keep your data</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          We keep your personal data for as long as your account is active. If you ask us to
          delete your account, we will remove your personal information from the system within a
          reasonable period. Some ladder history records (such as historical rank entries) may be
          retained in anonymised or aggregate form for record-keeping purposes.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          If your account becomes inactive or is removed from the ladder by an admin, your account
          data is retained unless you specifically request deletion.
        </p>
      </section>

      {/* Your rights */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Your rights</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Under UK GDPR, you have the following rights in relation to your personal data:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            "Right of access — you can request a copy of the personal data we hold about you.",
            "Right to rectification — you can ask us to correct inaccurate or incomplete data.",
            "Right to erasure — you can ask us to delete your account and personal data.",
            "Right to restriction — you can ask us to limit how we use your data in certain circumstances.",
            "Right to object — you can object to certain types of processing.",
            "Right to data portability — you can ask for your data in a machine-readable format.",
          ].map((right) => (
            <li key={right} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                ✓
              </span>
              {right}
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-600 leading-relaxed pt-1">
          To exercise any of these rights, please contact us using the details below. We will
          respond within one month.
        </p>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Contact us</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          For any questions about this Privacy Policy, or to make a request regarding your personal
          data, please contact the site owner and admin via the email address shown in the app.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          If you are not satisfied with how we handle your request, you have the right to lodge a
          complaint with the Information Commissioner&apos;s Office (ICO), the UK supervisory
          authority for data protection:
        </p>
        <a
          href="https://ico.org.uk/make-a-complaint"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
        >
          ICO — Make a complaint ↗
        </a>
      </section>

      {/* CTA */}
      <div className="flex items-center gap-4 pb-4">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Create an account →
        </Link>
        <Link
          href="/ladder"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          View standings
        </Link>
      </div>
    </div>
  );
}
