import { Link, useLocation } from "wouter";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";

type PageKind = "privacy" | "terms" | "community" | "security";

const content: Record<PageKind, { eyebrow: string; title: string; intro: string; sections: Array<{ heading: string; body: string }> }> = {
  privacy: {
    eyebrow: "CROSAIM · privacidad", title: "Privacidad con propósito competitivo", intro: "Esta página describe la información que la plataforma puede tratar cuando usas el Control Center, presentas una postulación o vinculas una cuenta Discord. Solo deben recopilarse los datos necesarios para operar estos servicios.",
    sections: [
      { heading: "Datos tratados", body: "Las postulaciones pueden incluir nombre o Riot ID, usuario e identificador de Discord, rol, rango, región, disponibilidad, mensaje y datos de contacto que la persona entregue voluntariamente. La vinculación con Discord puede asociar el identificador, nombre visible y avatar de la cuenta." },
      { heading: "Finalidad", body: "Los datos se usan para revisar candidaturas, coordinar entrevistas y tryouts, gestionar el roster, mostrar el estado de una candidatura y mantener registros operativos y de seguridad. Los eventos técnicos se conservan para prevenir duplicados, investigar errores y proteger la plataforma." },
      { heading: "Almacenamiento y terceros", body: "Discord gestiona su propia autenticación y comunidad. Supabase puede operar como fuente de verdad para perfiles, postulaciones y eventos. La aplicación no debe exponer claves de servicio, tokens de bot, secretos OAuth ni webhooks al navegador." },
      { heading: "Opciones de la persona", body: "Puedes pedir revisión, corrección o eliminación de información personal cuando corresponda. Las solicitudes deben evaluarse junto con las obligaciones de seguridad y los registros mínimos necesarios para prevenir fraude o abuso." },
      { heading: "Contacto", body: "Para preguntas de privacidad o una solicitud relacionada con datos, escribe a feispla@zohomail.com. Esta política se actualizará cuando cambien las funciones implementadas; no promete controles que todavía no existan." },
    ],
  },
  terms: {
    eyebrow: "CROSAIM · términos", title: "Términos de uso de la plataforma", intro: "CROSAIM ofrece herramientas para comunidad, operación esports, postulaciones, roster, eventos y futuras experiencias de juego. Al utilizar la plataforma o la comunidad Discord, aceptas estas reglas de uso responsable.",
    sections: [
      { heading: "Cuenta y comunidad", body: "La información aportada debe ser razonablemente exacta. Cada persona es responsable de su conducta en la web y Discord; se prohíbe el acoso, fraude, spam, suplantación, uso indebido de cuentas y contenido que vulnere derechos de terceros." },
      { heading: "Postulaciones, tryouts y roster", body: "Enviar una postulación no garantiza entrevista, aprobación, roster, participación en torneos ni compensación. Las decisiones competitivas pueden considerar disponibilidad, conducta, requisitos de equipo y criterios anunciados por CROSAIM." },
      { heading: "Contenido y propiedad", body: "Cada usuario conserva los derechos sobre su contenido original, pero concede a CROSAIM el permiso limitado necesario para revisarlo, alojarlo o mostrarlo dentro de la operación solicitada. No publiques material sin autorización." },
      { heading: "Seguridad y suspensión", body: "CROSAIM puede limitar o suspender acceso cuando sea necesario para seguridad, cumplimiento de normas, protección de la comunidad o integridad competitiva. Nunca se deben compartir tokens, contraseñas ni claves privadas en canales o formularios." },
      { heading: "Cambios y contacto", body: "Las funciones, torneos y reglas pueden evolucionar. Los cambios relevantes se comunicarán por los canales disponibles. Para consultas, usa feispla@zohomail.com o el servidor oficial de Discord." },
    ],
  },
  community: {
    eyebrow: "CROSAIM · comunidad", title: "Compite con respeto", intro: "La comunidad CROSAIM conecta jugadores, staff, contenido y competición. Discord es el espacio de operación en tiempo real; el Control Center mantiene la información y las decisiones trazables.",
    sections: [
      { heading: "Cómo participar", body: "Lee las reglas, preséntate, usa los canales de comunidad y comparte contenido propio de forma respetuosa. Para buscar equipo, publica una descripción clara de tu rol, rango, región y disponibilidad sin revelar datos innecesarios." },
      { heading: "Postular al roster", body: "Completa una postulación con información verificable. El flujo es POSTULACIÓN, REVISIÓN, ENTREVISTA en el canal de voz 𝑽𝑨𝑳𝑶𝑹𝑨𝑵𝑻, APROBADA o RECHAZADA, y después TRYOUT o ROSTER según la decisión competitiva." },
      { heading: "Conducta y moderación", body: "Se exige respeto, comunicación deportiva y colaboración. El staff puede intervenir ante acoso, discriminación, spam, contenido dañino o conductas que comprometan la seguridad. Las sanciones se aplican de forma proporcional y se registran para revisión interna." },
      { heading: "Soporte", body: "Utiliza los canales de soporte y los avisos operativos cuando estén disponibles. Las incidencias de seguridad deben comunicarse en privado a feispla@zohomail.com, sin publicar secretos ni información personal." },
    ],
  },
  security: {
    eyebrow: "CROSAIM · seguridad", title: "Seguridad por diseño", intro: "CROSAIM aplica validación de entradas, controles de acceso, registros de auditoría, protección contra duplicados y gestión de secretos mediante variables de entorno del servidor.",
    sections: [
      { heading: "Protección de credenciales", body: "Los tokens de bot, claves de servicio Supabase, secretos OAuth y webhooks se almacenan exclusivamente en la configuración segura del servidor. Nunca deben incluirse en GitHub, formularios públicos, capturas ni mensajes de Discord." },
      { heading: "Discord y permisos", body: "El bot debe usar el menor privilegio posible: ver canales, enviar mensajes, historial, enlaces, adjuntos, comandos, conectar, hablar, mover miembros y gestionar roles solo cuando el flujo lo requiera. Administrator no es necesario para este diseño." },
      { heading: "Reportar una vulnerabilidad", body: "No abras un informe público con información sensible. Envía una descripción, pasos de reproducción e impacto a feispla@zohomail.com. No explotes una vulnerabilidad más allá de lo indispensable para demostrarla." },
      { heading: "Estado del servicio", body: "Errores de sincronización y fallos de Discord deben registrarse sin interrumpir una candidatura. La plataforma conservará eventos pendientes para reintentos idempotentes y mostrará información de estado cuando esté disponible." },
    ],
  },
};

export default function InfoPage({ kind }: { kind: PageKind }) {
  const [location] = useLocation();
  const page = content[kind];
  return <main className="min-h-screen bg-[#090d13] px-5 py-10 text-[#d7e0ea] md:px-10"><div className="mx-auto max-w-4xl"><Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#a8ff2a] hover:text-white"><ArrowLeft className="h-4 w-4" /> Volver al Control Center</Link><header className="mt-12 border-b border-[#26374b] pb-8"><div className="text-xs font-bold uppercase tracking-[.16em] text-[#9b3dff]">{page.eyebrow}</div><h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-white md:text-6xl">{page.title}</h1><p className="mt-5 max-w-3xl text-base leading-7 text-[#aebdcc]">{page.intro}</p></header><div className="space-y-8 py-10">{page.sections.map((section) => <section key={section.heading} className="rounded-xl border border-[#223146] bg-[#0d141e] p-6"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase text-white"><ShieldCheck className="h-5 w-5 text-[#a8ff2a]" /> {section.heading}</h2><p className="mt-4 leading-7 text-[#b7c4d3]">{section.body}</p></section>)}</div>{kind === "community" && <a href="https://discord.gg/9MKHk6aJvk" target="_blank" rel="noreferrer" className="mb-12 inline-flex items-center gap-2 rounded-lg bg-[#5865f2] px-5 py-3 text-sm font-bold text-white hover:bg-[#6b76ff]">Unirse al Discord oficial <ExternalLink className="h-4 w-4" /></a>}<footer className="border-t border-[#26374b] py-7 text-xs text-[#8494a8]">CROSAIM · <Link href="/privacy" className="hover:text-white">Privacidad</Link> · <Link href="/terms" className="hover:text-white">Términos</Link> · <Link href="/community" className="hover:text-white">Comunidad</Link> · <Link href="/security" className="hover:text-white">Seguridad</Link> · Ruta actual: {location}</footer></div></main>;
}
