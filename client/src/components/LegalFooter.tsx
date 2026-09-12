import { Link } from "wouter";

const links = [
  ["Privacidad", "/privacy"],
  ["Términos", "/terms"],
  ["Normas de la comunidad", "/community"],
  ["Seguridad", "/security"],
] as const;

export default function LegalFooter() {
  return (
    <footer className="border-t border-[#233247] bg-[#090e15] px-4 py-5 text-xs text-[#7f8fa3]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} CROSAIM. Gaming, esports y comunidad.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal y comunidad">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
