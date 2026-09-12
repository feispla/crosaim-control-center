import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function PolicyPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#080d14] px-4 py-10 text-[#d9e2ee] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#91a3b8] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Volver al Control Center
        </Link>

        <header className="border-b border-[#26364b] pb-8">
          <div className="text-xs font-bold uppercase tracking-[.18em] text-[#a8ff2a]">{eyebrow}</div>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9aa9bb]">{intro}</p>
          <p className="mt-3 text-xs text-[#68798d]">Última actualización: 11 de septiembre de 2026</p>
        </header>

        <article className="policy-content space-y-8 py-8 text-sm leading-7 text-[#b8c4d2]">{children}</article>

        <aside className="rounded-xl border border-[#2a3a4f] bg-[#0f1721] p-5 text-sm text-[#95a5b8]">
          <strong className="text-white">Contacto CROSAIM</strong>
          <p className="mt-2">Seguridad y privacidad: feispla@zohomail.com</p>
          <a
            href="https://discord.gg/9MKHk6aJvk"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[#a8ff2a] hover:text-white"
          >
            Comunidad de Discord <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </aside>
      </div>
    </main>
  );
}

export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-bold uppercase tracking-tight text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
