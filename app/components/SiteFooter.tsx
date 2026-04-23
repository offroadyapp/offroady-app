import Link from 'next/link';

const legalLinks = [
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/8 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="font-medium text-[#243126]">Offroady, built for BC off-roaders.</div>
          <div className="mt-1 max-w-2xl text-sm text-gray-500">Community trail, trip, and event information for planning, not a guarantee of safety, legality, access, or suitability.</div>
        </div>
        <div className="flex flex-wrap gap-5">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#2f5d3a]">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
