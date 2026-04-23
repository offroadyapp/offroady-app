import type { Metadata } from 'next';
import PageShell from '@/app/components/PageShell';

export const metadata: Metadata = {
  title: 'Privacy Policy | Offroady',
  description: 'How Offroady handles account, community, and technical information.',
};

const sections = [
  {
    title: '1. Information We May Collect',
    body: [
      'We may collect information that you provide directly to us, including account registration details, profile information, display name, contact details you choose to provide, trail submissions, trip plans, comments, invitations, preferences, and communications you send to us.',
      'We may also collect limited technical or usage information needed to operate, maintain, improve, and secure the website, such as device or browser information, log data, approximate usage activity, authentication or session-related information, and error or performance information.',
    ],
  },
  {
    title: '2. Public and Shared Content',
    body: [
      'Some content on Offroady is designed to be visible to others as part of the product experience. Depending on the feature, this may include public comments, trail proposals, planned trips, public-facing display names, and other content intentionally shared with the community.',
      'Users should avoid posting sensitive personal information in public areas of the site.',
    ],
  },
  {
    title: '3. How We Use Information',
    body: [
      'We may use information to operate the website, provide user accounts and core features, display trails, trips, comments, and community content, communicate with users, improve product experience, maintain security, investigate misuse or abuse, and comply with legal obligations.',
    ],
  },
  {
    title: '4. Sharing of Information',
    body: [
      'We do not intend to publicly expose private user information unless the relevant feature is clearly meant to do so.',
      'However, information may be visible when users intentionally post or share it through public or community features, when disclosure is required by law, when needed to protect the platform, users, or the rights of others, or when necessary to operate the site through service providers or technical infrastructure.',
    ],
  },
  {
    title: '5. Data Security',
    body: [
      'We take reasonable steps to help protect information, but no website or online system can guarantee absolute security. Users should use caution and avoid submitting unnecessary sensitive information.',
    ],
  },
  {
    title: '6. User Responsibility',
    body: [
      'Users are responsible for the content they choose to post, share, or make visible on the platform. Please do not post confidential, highly sensitive, or unnecessary personal information in public or shared areas.',
    ],
  },
  {
    title: '7. Policy Updates',
    body: [
      'We may update this Privacy Policy from time to time. Continued use of the site after updates may constitute acceptance of the revised policy.',
    ],
  },
  {
    title: '8. Contact',
    body: [
      'If you need to contact Offroady about privacy questions, please use the site contact method or any future contact details we publish for the platform. Until a dedicated contact page is added, treat this policy as the general reference point for how information is handled on the site.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Legal</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#243126]">Privacy Policy</h1>
          <p className="mt-6 text-base leading-8 text-gray-700">
            Offroady respects your privacy and aims to handle user information responsibly. This Privacy Policy explains,
            in general terms, what information we may collect, how we may use it, and what users should understand when
            using the site.
          </p>
          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="rounded-2xl bg-[#f7faf6] p-6">
                <h2 className="text-2xl font-bold text-[#243126]">{section.title}</h2>
                <div className="mt-4 space-y-4 text-base leading-8 text-gray-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
