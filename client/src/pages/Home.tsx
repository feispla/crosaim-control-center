import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Command,
  ExternalLink,
  FileText,
  Flame,
  Gamepad2,
  Gauge,
  Globe2,
  Link2,
  Menu,
  Plus,
  Radio,
  Search,
  Send,
  Shield,
  Swords,
  Target,
  Trophy,
  UserPlus,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Section = "overview" | "roster" | "tournaments" | "content" | "analytics";
type ContentStatus = "Borrador" | "Listo para publicar" | "Publicado";
type ContentItem = {
  id: number;
  title: string;
  type: string;
  platform: "Tracker.gg" | "TikTok / Reels" | "Discord";
  status: ContentStatus;
  accent: string;
  description: string;
};
type Player = {
  id: number;
  handle: string;
  role: string;
  rank: string;
  availability: string;
  status: "Activo" | "Tryout" | "Pendiente";
  color: string;
};

const trackerUrl = "https://tracker.gg/valorant/guides/clips";
const tpgUrl = "https://torneosprogamers.com/";
const tpgRegisterUrl = "https://app.torneosprogamers.com/register";

const initialPlayers: Player[] = [
  { id: 1, handle: "CROSAIM · IGL", role: "Líder / IGL", rank: "Ascendant", availability: "Noches", status: "Activo", color: "#e6293f" },
  { id: 2, handle: "CROSAIM · FLEX", role: "Flex", rank: "Diamond", availability: "Flexible", status: "Activo", color: "#1677ff" },
  { id: 3, handle: "CROSAIM · DUELIST", role: "Duelista", rank: "Ascendant", availability: "Noches", status: "Activo", color: "#a8ff2a" },
  { id: 4, handle: "NUEVO TALENTO", role: "Controlador", rank: "Por verificar", availability: "Por confirmar", status: "Tryout", color: "#9b3dff" },
];

const initialContent: ContentItem[] = [
  { id: 1, title: "Fade — Haunt para retake B", type: "Guía táctica · 09 s", platform: "Tracker.gg", status: "Listo para publicar", accent: "#1677ff", description: "Clip corto con lineup, mapa y fase defensiva." },
  { id: 2, title: "Comunicación: tres datos que sí importan", type: "Carrusel · 04 slides", platform: "TikTok / Reels", status: "Borrador", accent: "#e6293f", description: "Información breve, clara y accionable para el squad." },
  { id: 3, title: "Convocatoria abierta CROSAIM", type: "Reclutamiento · 20 s", platform: "Discord", status: "Publicado", accent: "#a8ff2a", description: "Requisitos, disponibilidad y ruta de tryout." },
];

const tournamentData = [
  { name: "TPG Maracay", date: "26–27 SEP", city: "C.C. Parque Los Aviadores", state: "Próximo", color: "#e6293f", url: "https://torneosprogamers.com/maracay/" },
  { name: "TPG Acarigua", date: "31 OCT–01 NOV", city: "Salón Villa Europa", state: "Planificación", color: "#ff7a18", url: "https://torneosprogamers.com/?page_id=5392" },
  { name: "TPG Caracas", date: "28–29 NOV", city: "Ubicación por definir", state: "Por anunciar", color: "#66758a", url: tpgUrl },
];

const navItems: { id: Section; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Resumen operativo", icon: Gauge },
  { id: "roster", label: "Plantilla & tryouts", icon: Users },
  { id: "tournaments", label: "TPG / Torneos", icon: Trophy },
  { id: "content", label: "Contenido Tracker", icon: Video },
  { id: "analytics", label: "Análisis & estrategia", icon: BarChart3 },
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "red" | "blue" | "green" | "orange" | "purple" | "slate" }) {
  const tones = {
    red: "border-[#74303b] bg-[#35171f] text-[#ff8994]",
    blue: "border-[#24528f] bg-[#102640] text-[#73b2ff]",
    green: "border-[#466b2b] bg-[#172817] text-[#b9ff78]",
    orange: "border-[#714521] bg-[#301d11] text-[#ffad69]",
    purple: "border-[#51327b] bg-[#241633] text-[#d2a8ff]",
    slate: "border-[#2c3b4f] bg-[#17202c] text-[#aab8c8]",
  };
  return <span className={classNames("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em]", tones[tone])}>{children}</span>;
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="eyebrow mb-2">{eyebrow}</div>
        <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#93a1b2]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button aria-label={label} title={label} onClick={onClick} className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-[#26364b] bg-[#0f1721] text-[#96a5b8] transition hover:border-[#526b8a] hover:text-white">{children}</button>;
}

function Overview({ setSection, players, content }: { setSection: (section: Section) => void; players: Player[]; content: ContentItem[] }) {
  const activePlayers = players.filter((player) => player.status === "Activo").length;
  const published = content.filter((item) => item.status === "Publicado").length;
  return (
    <>
      <div className="panel scanline data-grid relative overflow-hidden p-6 md:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2"><Badge tone="red"><Radio className="h-3 w-3" /> Operación activa</Badge><span className="text-[11px] uppercase tracking-[.16em] text-[#718096]">Semana 01 · preparación competitiva</span></div>
            <h1 className="font-display text-5xl font-bold uppercase leading-[.87] tracking-tight text-white md:text-7xl">Sube el nivel.<br /><span className="text-[#e6293f]">Compite con propósito.</span></h1>
            <p className="mt-6 max-w-xl text-sm leading-6 text-[#a6b2c1]">CROSAIM es un entorno para entrenar, analizar y presentarse en torneos con una plantilla coordinada. Este centro conecta operación competitiva, publicaciones tácticas y seguimiento del equipo.</p>
          </div>
          <div className="min-w-[230px] border-l border-[#29374a] pl-5 lg:mb-1">
            <div className="eyebrow mb-3">Objetivo de esta semana</div>
            <div className="flex items-end justify-between"><span className="font-display text-4xl font-bold text-white">68%</span><span className="mb-1 text-xs text-[#8494a8]">17 / 25 acciones</span></div>
            <div className="progress-track mt-3"><div className="progress-fill" style={{ width: "68%" }} /></div>
            <p className="mt-3 text-xs leading-5 text-[#8e9daf]">Cerrar roster inicial, preparar 2 guías y dejar listo el registro TPG Maracay.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Jugadores activos", value: `${activePlayers}/5`, meta: "+1 en tryout", icon: Users, tone: "#e6293f", action: () => setSection("roster") },
          { label: "Próximo torneo", value: "18 días", meta: "TPG · Maracay", icon: Trophy, tone: "#ff7a18", action: () => setSection("tournaments") },
          { label: "Contenido en cola", value: `${content.filter((item) => item.status !== "Publicado").length}`, meta: "2 plataformas", icon: Video, tone: "#1677ff", action: () => setSection("content") },
          { label: "Ritmo operativo", value: "8.6/10", meta: "+12% esta semana", icon: Flame, tone: "#a8ff2a", action: () => setSection("analytics") },
        ].map((item) => (
          <button key={item.label} onClick={item.action} className="panel panel-hover group p-4 text-left">
            <div className="mb-5 flex items-center justify-between"><span className="eyebrow">{item.label}</span><item.icon className="h-4 w-4" style={{ color: item.tone }} /></div>
            <div className="font-display text-3xl font-bold tracking-tight text-white">{item.value}</div><div className="mt-1 text-xs text-[#8291a4]">{item.meta}</div>
            <ChevronRight className="mt-4 h-4 w-4 text-[#3d4c60] transition group-hover:translate-x-1 group-hover:text-white" />
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <div className="panel p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between"><div><div className="eyebrow mb-2">Pipeline de contenido</div><h2 className="font-display text-2xl font-bold uppercase text-white">Lo que sale esta semana</h2></div><button onClick={() => setSection("content")} className="focus-ring text-xs font-bold uppercase tracking-[.12em] text-[#e6293f] hover:text-white">Ver tablero <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button></div>
          <div className="space-y-3">
            {content.map((item) => <ContentRow key={item.id} item={item} compact />)}
          </div>
        </div>
        <div className="panel p-5 md:p-6">
          <div className="eyebrow mb-2">Próximos hitos</div><h2 className="font-display text-2xl font-bold uppercase text-white">Calendario TPG</h2>
          <div className="mt-6 space-y-1">{tournamentData.map((item, index) => <TournamentRow key={item.name} item={item} first={index === 0} />)}</div>
          <button onClick={() => setSection("tournaments")} className="focus-ring mt-5 flex w-full items-center justify-center gap-2 border-t border-[#202e40] pt-4 text-xs font-bold uppercase tracking-[.12em] text-[#a7b6c7] transition hover:text-white">Gestionar participación <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
        <div className="panel p-5 md:p-6">
          <div className="eyebrow mb-2">Control rápido</div><h2 className="font-display text-2xl font-bold uppercase text-white">Dos plataformas.<br /><span className="text-[#e6293f]">Un solo proceso.</span></h2>
          <p className="mt-3 text-sm leading-6 text-[#8e9daf]">Usa Tracker.gg para que el equipo sea descubrible por su conocimiento táctico. Usa TPG para convertir esa visibilidad en competición, ranking y experiencia real.</p>
          <div className="mt-6 space-y-2">
            <a href={trackerUrl} target="_blank" rel="noreferrer" className="focus-ring flex items-center justify-between rounded-xl border border-[#23364f] bg-[#101c2a] px-4 py-3 transition hover:border-[#3f6da8]"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1677ff]/15 text-[#6eaeff]"><Target className="h-4 w-4" /></span><span><strong className="block text-sm text-white">Tracker.gg</strong><small className="text-xs text-[#8191a5]">Guías tácticas de 5–15 s</small></span></span><ExternalLink className="h-4 w-4 text-[#6887b1]" /></a>
            <a href={tpgUrl} target="_blank" rel="noreferrer" className="focus-ring flex items-center justify-between rounded-xl border border-[#49301c] bg-[#251a12] px-4 py-3 transition hover:border-[#a7642c]"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7a18]/15 text-[#ffad69]"><Trophy className="h-4 w-4" /></span><span><strong className="block text-sm text-white">Torneos Pro Gamers</strong><small className="text-xs text-[#a58c78]">Retos, ranking y playoffs</small></span></span><ExternalLink className="h-4 w-4 text-[#c08450]" /></a>
          </div>
        </div>
        <div className="panel p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between"><div><div className="eyebrow mb-2">Actividad del equipo</div><h2 className="font-display text-2xl font-bold uppercase text-white">Últimos movimientos</h2></div><Activity className="h-5 w-5 text-[#718198]" /></div>
          <div className="divide-y divide-[#1c2938]">
            <ActivityRow icon={ClipboardCheck} color="#a8ff2a" title="Checklist de TPG actualizado" time="Hace 14 min" detail="Maracay · registro de jugadores" />
            <ActivityRow icon={Video} color="#1677ff" title="Guía táctica lista para revisión" time="Hace 1 h" detail="Fade · Haunt para retake B" />
            <ActivityRow icon={UserPlus} color="#9b3dff" title="Nuevo jugador en tryout" time="Hace 3 h" detail="Controlador · por verificar" />
            <ActivityRow icon={BarChart3} color="#ff7a18" title="Ritmo de preparación subió" time="Ayer" detail="+12% vs. semana anterior" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#1c2938] pt-4 text-xs text-[#8090a4]"><span>{published} publicación activa</span><span className="flex items-center gap-1 text-[#b7c3d0]"><span className="h-1.5 w-1.5 rounded-full bg-[#a8ff2a]" /> Sistema sincronizado</span></div>
        </div>
      </div>
    </>
  );
}

function ContentRow({ item, compact = false }: { item: ContentItem; compact?: boolean }) {
  const statusTone = item.status === "Publicado" ? "green" : item.status === "Listo para publicar" ? "blue" : "slate";
  return <div className={classNames("group flex items-center gap-3 rounded-xl border border-[#1e2c3d] bg-[#0d141e] p-3 transition hover:border-[#344a66]", !compact && "p-4")}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ color: item.accent, backgroundColor: `${item.accent}18` }}>{item.platform === "Tracker.gg" ? <Target className="h-4 w-4" /> : item.platform === "Discord" ? <Users className="h-4 w-4" /> : <Video className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white">{item.title}</div><div className="mt-1 truncate text-xs text-[#7f8ea1]">{item.type} · {item.platform}</div></div><Badge tone={statusTone}>{item.status}</Badge><ChevronRight className="hidden h-4 w-4 text-[#53647a] sm:block" /></div>;
}

function TournamentRow({ item, first = false }: { item: typeof tournamentData[number]; first?: boolean }) {
  return <div className="group flex gap-3 border-b border-[#1c2938] py-4 last:border-0"><div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color, boxShadow: first ? `0 0 0 4px ${item.color}20` : undefined }} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><strong className="truncate text-sm text-white">{item.name}</strong><span className="whitespace-nowrap font-display text-sm font-bold text-[#dbe4ed]">{item.date}</span></div><div className="mt-1 truncate text-xs text-[#7f8ea1]">{item.city}</div></div><a href={item.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${item.name}`} className="self-center text-[#708399] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a></div>;
}

function ActivityRow({ icon: Icon, color, title, time, detail }: { icon: typeof Activity; color: string; title: string; time: string; detail: string }) {
  return <div className="flex items-center gap-3 py-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ color, backgroundColor: `${color}16` }}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-[#e6edf5]">{title}</div><div className="truncate text-xs text-[#738197]">{detail}</div></div><span className="whitespace-nowrap text-[10px] uppercase tracking-[.08em] text-[#66768b]">{time}</span></div>;
}

function Roster({ players, setPlayers }: { players: Player[]; setPlayers: React.Dispatch<React.SetStateAction<Player[]>> }) {
  const [showForm, setShowForm] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [newRole, setNewRole] = useState("Flex");
  const addPlayer = () => { if (!newHandle.trim()) return; setPlayers((current) => [...current, { id: Date.now(), handle: newHandle.trim().toUpperCase(), role: newRole, rank: "Por verificar", availability: "Por confirmar", status: "Pendiente", color: "#66758a" }]); setNewHandle(""); setShowForm(false); };
  return <>
    <SectionHeader eyebrow="Operación · roster" title="Plantilla & tryouts" description="Un registro claro de quién está activo, qué rol cubre y qué debe verificarse antes de competir. Mantén la plantilla lista para el siguiente reto." action={<button onClick={() => setShowForm((value) => !value)} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[#e6293f] px-4 py-2.5 text-xs font-bold uppercase tracking-[.12em] text-white transition hover:bg-[#f04153]"><Plus className="h-4 w-4" /> Añadir jugador</button>} />
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4"><SmallMetric label="Activos" value={players.filter((player) => player.status === "Activo").length.toString()} note="listos" color="#a8ff2a" /><SmallMetric label="Tryout" value={players.filter((player) => player.status === "Tryout").length.toString()} note="en evaluación" color="#9b3dff" /><SmallMetric label="Pendientes" value={players.filter((player) => player.status === "Pendiente").length.toString()} note="por completar" color="#ff7a18" /><SmallMetric label="Cupo objetivo" value={`${players.length}/5`} note="plantilla base" color="#1677ff" /></div>
    {showForm && <div className="panel mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-end"><label className="flex-1"><span className="eyebrow mb-2 block">Riot ID / Alias</span><input value={newHandle} onChange={(event) => setNewHandle(event.target.value)} placeholder="Ej. CROSAIM · SENTINEL" className="focus-ring w-full rounded-lg border border-[#2c3c50] bg-[#0a1018] px-3 py-2.5 text-sm text-white placeholder:text-[#637287]" /></label><label className="w-full md:w-48"><span className="eyebrow mb-2 block">Rol</span><select value={newRole} onChange={(event) => setNewRole(event.target.value)} className="focus-ring w-full rounded-lg border border-[#2c3c50] bg-[#0a1018] px-3 py-2.5 text-sm text-white"><option>Flex</option><option>IGL</option><option>Duelista</option><option>Iniciador</option><option>Controlador</option><option>Sentinela</option></select></label><button onClick={addPlayer} className="focus-ring rounded-lg border border-[#456c30] bg-[#1a3119] px-4 py-2.5 text-xs font-bold uppercase tracking-[.1em] text-[#b9ff78] hover:bg-[#25451f]">Guardar</button></div>}
    <div className="panel overflow-hidden"><div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_110px] gap-4 border-b border-[#202e3e] px-5 py-3 md:grid"><div className="eyebrow">Jugador</div><div className="eyebrow">Rol</div><div className="eyebrow">Rango</div><div className="eyebrow">Disponibilidad</div><div className="eyebrow">Estado</div></div><div className="divide-y divide-[#1c2938]">{players.map((player) => <div key={player.id} className="grid gap-3 px-4 py-4 transition hover:bg-[#111a25] md:grid-cols-[1.5fr_1fr_1fr_1fr_110px] md:items-center md:gap-4 md:px-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg font-display text-lg font-bold" style={{ color: player.color, backgroundColor: `${player.color}16` }}>{player.handle.charAt(0)}</span><div><div className="text-sm font-bold text-white">{player.handle}</div><div className="mt-1 text-xs text-[#8190a3] md:hidden">{player.role} · {player.rank}</div></div></div><div className="hidden text-sm text-[#bec9d6] md:block">{player.role}</div><div className="hidden text-sm text-[#bec9d6] md:block">{player.rank}</div><div className="hidden text-sm text-[#bec9d6] md:block">{player.availability}</div><div><Badge tone={player.status === "Activo" ? "green" : player.status === "Tryout" ? "purple" : "slate"}>{player.status}</Badge></div></div>)}</div></div>
    <div className="mt-4 panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div><div className="eyebrow mb-2">Regla de ingreso CROSAIM</div><p className="text-sm leading-6 text-[#a5b1c0]">Mentalidad competitiva, comunicación efectiva, compromiso con el entrenamiento y disponibilidad para torneos. La actitud también entra en el roster.</p></div><a href={tpgRegisterUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#704523] bg-[#2b1b10] px-4 py-2.5 text-xs font-bold uppercase tracking-[.1em] text-[#ffad69] hover:bg-[#3a2414]">Registrar perfil TPG <ExternalLink className="h-3.5 w-3.5" /></a></div>
  </>;
}

function Tournaments() {
  const [registered, setRegistered] = useState<string[]>([]);
  return <>
    <SectionHeader eyebrow="Competición · TPG" title="Torneos & calendario" description="Planifica la ruta competitiva de CROSAIM: registro, preparación, participación y seguimiento de cada parada. Los enlaces llevan al registro oficial de TPG." action={<a href={tpgUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-[#704523] bg-[#2b1b10] px-4 py-2.5 text-xs font-bold uppercase tracking-[.12em] text-[#ffad69] hover:bg-[#3a2414]">Abrir TPG <ExternalLink className="h-4 w-4" /></a>} />
    <div className="panel mb-4 overflow-hidden"><div className="border-b border-[#253346] bg-[#121c28] px-5 py-4"><div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-[#ff7a18]" /><span className="text-sm font-bold text-white">Ruta CROSAIM · Temporada 2026</span><Badge tone="orange">3 paradas</Badge></div></div><div className="grid divide-y divide-[#1e2b3b] md:grid-cols-3 md:divide-x md:divide-y-0">{tournamentData.map((item, index) => { const isRegistered = registered.includes(item.name); return <div key={item.name} className="p-5"><div className="mb-8 flex items-start justify-between"><div><span className="eyebrow">0{index + 1} / parada</span><h2 className="mt-2 font-display text-3xl font-bold uppercase text-white">{item.name.replace("TPG ", "")}</h2></div><span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 0 5px ${item.color}20` }} /></div><div className="font-display text-2xl font-bold text-[#dce6ef]">{item.date}</div><div className="mt-1 text-xs text-[#8190a3]">{item.city}</div><div className="mt-6 flex items-center justify-between gap-3"><Badge tone={index === 0 ? "red" : index === 1 ? "orange" : "slate"}>{item.state}</Badge><button onClick={() => setRegistered((current) => isRegistered ? current.filter((name) => name !== item.name) : [...current, item.name])} className={classNames("focus-ring rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] transition", isRegistered ? "border border-[#456c30] bg-[#1a3119] text-[#b9ff78]" : "border border-[#2c3d52] bg-[#172231] text-[#b9c8d7] hover:border-[#5a7597] hover:text-white")}>{isRegistered ? <><Check className="mr-1 inline h-3.5 w-3.5" /> En seguimiento</> : "Seguir parada"}</button></div><a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#71849a] hover:text-white">Ver información oficial <ArrowUpRight className="h-3 w-3" /></a></div>; })}</div></div>
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><div className="panel p-5 md:p-6"><div className="eyebrow mb-2">Proceso de participación</div><h2 className="font-display text-2xl font-bold uppercase text-white">De perfil a playoffs</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{[{ icon: UserPlus, n: "01", t: "Registrar", d: "Crea el perfil gamer y completa los datos." }, { icon: Swords, n: "02", t: "Jugar retos", d: "Suma victorias y sube en el ranking." }, { icon: BarChart3, n: "03", t: "Dar seguimiento", d: "Registra resultados y puntos de cada jugador." }, { icon: Trophy, n: "04", t: "Clasificar", d: "Los mejores avanzan a playoffs y premios." }].map((item) => <div key={item.n} className="rounded-xl border border-[#233144] bg-[#0c131c] p-4"><div className="flex items-center justify-between"><span className="font-display text-2xl font-bold text-[#3c4c61]">{item.n}</span><item.icon className="h-4 w-4 text-[#ff7a18]" /></div><div className="mt-3 text-sm font-bold text-white">{item.t}</div><div className="mt-1 text-xs leading-5 text-[#7f8ea1]">{item.d}</div></div>)}</div></div><div className="panel p-5 md:p-6"><div className="eyebrow mb-2">Control de acceso</div><h2 className="font-display text-2xl font-bold uppercase text-white">Qué falta conectar</h2><div className="mt-5 space-y-3"><CheckLine label="Calendario público TPG" done /><CheckLine label="Enlace de registro de jugadores" done /><CheckLine label="Resultados de retos y ranking" /><CheckLine label="Cuenta administradora CROSAIM" /></div><p className="mt-5 border-t border-[#202e40] pt-4 text-xs leading-5 text-[#7b8b9e]">La integración oficial de datos depende de que TPG habilite una cuenta, API o exportación. Mientras tanto, este panel mantiene el control operativo y enlaza cada paso con la fuente oficial.</p></div></div>
  </>;
}

function CheckLine({ label, done = false }: { label: string; done?: boolean }) { return <div className="flex items-center gap-3 text-sm text-[#c4ceda]"><span className={classNames("flex h-5 w-5 items-center justify-center rounded-full border", done ? "border-[#456c30] bg-[#203a1e] text-[#b9ff78]" : "border-[#37485e] text-[#65758a]")}>{done ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-[#65758a]" />}</span>{label}</div>; }

function ContentBoard({ content, setContent }: { content: ContentItem[]; setContent: React.Dispatch<React.SetStateAction<ContentItem[]>> }) {
  const [activeTab, setActiveTab] = useState<"all" | ContentItem["platform"]>("all");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const filtered = activeTab === "all" ? content : content.filter((item) => item.platform === activeTab);
  const copyBrief = async (item: ContentItem) => { try { await navigator.clipboard.writeText(`${item.title}\n${item.description}\n\nCROSAIM · Competimos con propósito.`); } catch {} setCopied(item.id); window.setTimeout(() => setCopied(null), 1800); };
  const addContent = () => { if (!newTitle.trim()) return; setContent((items) => [{ id: Date.now(), title: newTitle.trim(), type: "Nueva pieza · por definir", platform: "Tracker.gg", status: "Borrador", accent: "#1677ff", description: "Añade aquí el mapa, agente, fase y aprendizaje principal." }, ...items]); setNewTitle(""); setShowForm(false); };
  return <>
    <SectionHeader eyebrow="Contenido · descubrimiento" title="Contenido Tracker" description="Convierte el conocimiento del equipo en piezas tácticas cortas, claras y publicables. Tracker.gg aprueba las guías de la comunidad antes de mostrarlas." action={<button onClick={() => setShowForm((value) => !value)} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[#1677ff] px-4 py-2.5 text-xs font-bold uppercase tracking-[.12em] text-white transition hover:bg-[#2e87ff]"><Plus className="h-4 w-4" /> Nueva pieza</button>} />
    <div className="panel mb-4 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"><div className="flex flex-wrap gap-2">{(["all", "Tracker.gg", "TikTok / Reels", "Discord"] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={classNames("focus-ring rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] transition", activeTab === tab ? "bg-[#e8eef5] text-[#0c131c]" : "border border-[#2a3a4e] text-[#8fa0b3] hover:text-white")}>{tab === "all" ? "Todo el pipeline" : tab}</button>)}</div><a href={trackerUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#7cb7ff] hover:text-white">Abrir guías de Tracker <ExternalLink className="h-3.5 w-3.5" /></a></div>
    {showForm && <div className="panel mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-end"><label className="flex-1"><span className="eyebrow mb-2 block">Título de la pieza</span><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Ej. Sova · dart para limpiar A main" className="focus-ring w-full rounded-lg border border-[#2c3c50] bg-[#0a1018] px-3 py-2.5 text-sm text-white placeholder:text-[#637287]" /></label><button onClick={addContent} className="focus-ring rounded-lg border border-[#24528f] bg-[#102640] px-4 py-2.5 text-xs font-bold uppercase tracking-[.1em] text-[#73b2ff] hover:bg-[#153452]">Añadir al pipeline</button></div>}
    <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]"><div className="panel overflow-hidden"><div className="border-b border-[#202e3e] px-5 py-4"><div className="flex items-center justify-between"><div><div className="eyebrow mb-2">{filtered.length} piezas visibles</div><h2 className="font-display text-2xl font-bold uppercase text-white">Tablero de publicación</h2></div><FileText className="h-5 w-5 text-[#718198]" /></div></div><div className="divide-y divide-[#1c2938]">{filtered.map((item) => <div key={item.id} className="p-4 transition hover:bg-[#111a25] md:p-5"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ color: item.accent, backgroundColor: `${item.accent}18` }}>{item.platform === "Tracker.gg" ? <Target className="h-4 w-4" /> : <Video className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><h3 className="text-sm font-bold text-white">{item.title}</h3><div className="mt-1 text-xs text-[#7d8ca0]">{item.type} · {item.platform}</div></div><Badge tone={item.status === "Publicado" ? "green" : item.status === "Listo para publicar" ? "blue" : "slate"}>{item.status}</Badge></div><p className="mt-3 text-xs leading-5 text-[#8998aa]">{item.description}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => copyBrief(item)} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-[#2b3b50] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#a1afbf] hover:text-white">{copied === item.id ? <Check className="h-3 w-3 text-[#b9ff78]" /> : <Link2 className="h-3 w-3" />} {copied === item.id ? "Copiado" : "Copiar brief"}</button>{item.platform === "Tracker.gg" && <a href={trackerUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-[#24528f] bg-[#102640] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#73b2ff] hover:bg-[#153452]">Enviar a Tracker <ExternalLink className="h-3 w-3" /></a>}</div></div></div></div>)}</div></div><div className="space-y-4"><div className="panel p-5"><div className="eyebrow mb-2">Receta Tracker.gg</div><h2 className="font-display text-2xl font-bold uppercase text-white">Una guía que sí se ve</h2><div className="mt-5 space-y-3"><Step n="01" title="5–15 segundos" detail="Muestra el resultado sin introducciones largas." /><Step n="02" title="Agente + mapa" detail="Da contexto para que la guía sea filtrable." /><Step n="03" title="Un objetivo" detail="Un lineup, una entrada o una decisión." /><Step n="04" title="Aprendizaje" detail="Titula con claridad y explica el uso." /></div><a href={trackerUrl} target="_blank" rel="noreferrer" className="focus-ring mt-5 flex items-center justify-center gap-2 border-t border-[#202e40] pt-4 text-xs font-bold uppercase tracking-[.1em] text-[#7cb7ff] hover:text-white">Ver ejemplos de la comunidad <ArrowUpRight className="h-3.5 w-3.5" /></a></div><div className="panel p-5"><div className="eyebrow mb-2">Cadencia recomendada</div><h2 className="font-display text-2xl font-bold uppercase text-white">4 publicaciones / semana</h2><div className="mt-4 grid grid-cols-2 gap-2">{[{ day: "Lun", t: "Disciplina", c: "#e6293f" }, { day: "Mar", t: "Táctica", c: "#1677ff" }, { day: "Jue", t: "Clip", c: "#9b3dff" }, { day: "Dom", t: "Datos", c: "#a8ff2a" }].map((item) => <div key={item.day} className="rounded-lg border border-[#223043] bg-[#0b121a] p-3"><span className="eyebrow" style={{ color: item.c }}>{item.day}</span><div className="mt-2 text-xs font-bold text-white">{item.t}</div></div>)}</div></div></div></div>
  </>;
}

function Step({ n, title, detail }: { n: string; title: string; detail: string }) { return <div className="flex gap-3"><span className="font-display text-lg font-bold text-[#3b4c61]">{n}</span><div><div className="text-sm font-bold text-[#dce5ed]">{title}</div><p className="mt-1 text-xs leading-5 text-[#7f8ea1]">{detail}</p></div></div>; }

function Analytics() {
  return <>
    <SectionHeader eyebrow="Análisis · decisión" title="Estrategia & análisis" description="La recomendación para CROSAIM es tratar Tracker.gg como canal de descubrimiento y TPG como canal de competición. El centro propio coordina ambos, sin fingir una integración de datos que aún requiere credenciales o API oficiales." action={<button onClick={() => window.print()} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-[#2c3d52] bg-[#121c28] px-4 py-2.5 text-xs font-bold uppercase tracking-[.12em] text-[#b8c5d3] hover:text-white"><FileText className="h-4 w-4" /> Exportar vista</button>} />
    <div className="grid gap-4 lg:grid-cols-2"><div className="panel p-5 md:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102640] text-[#73b2ff]"><Target className="h-5 w-5" /></span><div><div className="eyebrow">Canal 01 · alcance</div><h2 className="font-display text-2xl font-bold uppercase text-white">Tracker.gg</h2></div></div><p className="mt-5 text-sm leading-6 text-[#a5b1c0]">La página de guías de Valorant está orientada a clips de 5–15 segundos enviados por la comunidad. Permite filtrar por agente, mapa y objetivo, y las guías pasan por una aprobación rápida antes de distribuirse.</p><div className="mt-5 space-y-3"><CheckLine label="Publicar conocimiento táctico" done /><CheckLine label="Asociar agente, mapa y objetivo" done /><CheckLine label="Construir autoridad del equipo" done /><CheckLine label="Métricas propias de CROSAIM" /></div><a href={trackerUrl} target="_blank" rel="noreferrer" className="focus-ring mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#24528f] bg-[#102640] px-4 py-3 text-xs font-bold uppercase tracking-[.1em] text-[#73b2ff] hover:bg-[#153452]">Ir a guías de Valorant <ExternalLink className="h-4 w-4" /></a></div><div className="panel p-5 md:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2b1b10] text-[#ffad69]"><Trophy className="h-5 w-5" /></span><div><div className="eyebrow">Canal 02 · competición</div><h2 className="font-display text-2xl font-bold uppercase text-white">Torneos Pro Gamers</h2></div></div><p className="mt-5 text-sm leading-6 text-[#a5b1c0]">TPG ofrece registro gratuito, retos, ranking, clasificación a playoffs, torneos presenciales y membresías. Es el lugar para convertir la preparación del roster en experiencia competitiva medible.</p><div className="mt-5 space-y-3"><CheckLine label="Crear perfil gamer" done /><CheckLine label="Jugar retos y subir ranking" done /><CheckLine label="Clasificar a playoffs" done /><CheckLine label="Resultados automáticos en CROSAIM" /></div><a href={tpgRegisterUrl} target="_blank" rel="noreferrer" className="focus-ring mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#704523] bg-[#2b1b10] px-4 py-3 text-xs font-bold uppercase tracking-[.1em] text-[#ffad69] hover:bg-[#3a2414]">Abrir registro oficial <ExternalLink className="h-4 w-4" /></a></div></div>
    <div className="panel mt-4 p-5 md:p-6"><div className="eyebrow mb-2">Recomendación de operación</div><h2 className="font-display text-3xl font-bold uppercase text-white">Un embudo, tres momentos</h2><div className="mt-6 grid gap-3 md:grid-cols-3">{[{ n: "01", title: "Descubrir", c: "#1677ff", icon: Search, detail: "Publica guías cortas, limpias y útiles para que jugadores de Valorant conozcan el criterio de CROSAIM." }, { n: "02", title: "Confiar", c: "#9b3dff", icon: Shield, detail: "Repite una identidad visual, comparte análisis y demuestra disciplina en cada publicación." }, { n: "03", title: "Competir", c: "#e6293f", icon: Trophy, detail: "Lleva al roster a TPG, registra los hitos y convierte la participación en historial competitivo." }].map((item) => <div key={item.n} className="relative overflow-hidden rounded-xl border border-[#243347] bg-[#0c131c] p-5"><span className="font-display text-5xl font-bold" style={{ color: `${item.c}42` }}>{item.n}</span><item.icon className="absolute right-5 top-5 h-5 w-5" style={{ color: item.c }} /><h3 className="mt-4 font-display text-2xl font-bold uppercase text-white">{item.title}</h3><p className="mt-2 text-xs leading-5 text-[#8493a6]">{item.detail}</p></div>)}</div></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[.7fr_1.3fr]"><div className="panel p-5"><div className="eyebrow mb-2">Límite actual</div><h2 className="font-display text-2xl font-bold uppercase text-white">Control responsable</h2><p className="mt-4 text-sm leading-6 text-[#94a2b3]">Este centro no suplanta el acceso de TPG o Tracker.gg. Guarda el plan operativo, genera briefs y enlaza los flujos oficiales. Para publicar o consultar datos privados se necesitará la cuenta autorizada de CROSAIM.</p></div><div className="panel p-5"><div className="eyebrow mb-2">Próximas conexiones</div><div className="grid gap-3 md:grid-cols-3"><Connection status="Recomendado" title="Cuenta CROSAIM" detail="Inicia sesión para guardar el equipo." tone="green" /><Connection status="Pendiente" title="TPG / resultados" detail="Requiere fuente oficial o exportación." tone="orange" /><Connection status="Manual" title="Tracker / envíos" detail="La publicación pasa por aprobación." tone="blue" /></div></div></div>
  </>;
}

function Connection({ status, title, detail, tone }: { status: string; title: string; detail: string; tone: "green" | "orange" | "blue" }) { return <div className="rounded-xl border border-[#243347] bg-[#0c131c] p-4"><Badge tone={tone}>{status}</Badge><div className="mt-3 text-sm font-bold text-white">{title}</div><p className="mt-1 text-xs leading-5 text-[#7f8ea1]">{detail}</p></div>; }
function SmallMetric({ label, value, note, color }: { label: string; value: string; note: string; color: string }) { return <div className="panel p-4"><div className="eyebrow">{label}</div><div className="mt-3 font-display text-3xl font-bold text-white">{value}</div><div className="mt-1 text-xs" style={{ color }}>{note}</div></div>; }

export default function Home() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [players, setPlayers] = useState<Player[]>(() => { try { const stored = localStorage.getItem("crosaim-players"); return stored ? JSON.parse(stored) : initialPlayers; } catch { return initialPlayers; } });
  const [content, setContent] = useState<ContentItem[]>(() => { try { const stored = localStorage.getItem("crosaim-content"); return stored ? JSON.parse(stored) : initialContent; } catch { return initialContent; } });
  useEffect(() => { localStorage.setItem("crosaim-players", JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem("crosaim-content", JSON.stringify(content)); }, [content]);
  const activeLabel = useMemo(() => navItems.find((item) => item.id === section)?.label ?? "Resumen operativo", [section]);
  return <div className="min-h-screen bg-[#070a0f] text-[#f2f6fa]">
    <aside className={classNames("fixed inset-y-0 left-0 z-40 w-[260px] border-r border-[#182536] bg-[#090d13] transition-transform duration-200 lg:translate-x-0", mobileNav ? "translate-x-0" : "-translate-x-full")}><div className="flex h-full flex-col"><div className="flex h-[86px] items-center justify-between border-b border-[#182536] px-5"><button onClick={() => setSection("overview")} className="focus-ring flex items-center gap-3 text-left"><span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#e6293f] font-display text-2xl font-bold text-white"><span className="absolute -right-2 top-1 h-12 w-4 rotate-25 bg-white/20" />C</span><span><strong className="block font-display text-xl font-bold tracking-wide text-white">CROSAIM</strong><small className="eyebrow !text-[9px] !tracking-[.22em]">Control Center</small></span></button><button onClick={() => setMobileNav(false)} className="focus-ring rounded p-1 text-[#738197] hover:text-white lg:hidden"><X className="h-5 w-5" /></button></div><div className="flex-1 overflow-y-auto px-3 py-6"><div className="eyebrow mb-3 px-3">Operaciones</div><nav className="space-y-1">{navItems.map((item) => <button key={item.id} onClick={() => { setSection(item.id); setMobileNav(false); }} className={classNames("focus-ring group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition", section === item.id ? "bg-[#1a1117] text-white" : "text-[#8796a9] hover:bg-[#111923] hover:text-white")}><item.icon className={classNames("h-4 w-4", section === item.id ? "text-[#e6293f]" : "text-[#617186] group-hover:text-white")} /><span className="flex-1">{item.label}</span>{section === item.id && <span className="h-1.5 w-1.5 rounded-full bg-[#e6293f]" />}</button>)}</nav><div className="my-7 border-t border-[#182536]" /><div className="eyebrow mb-3 px-3">Accesos oficiales</div><a href={trackerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[#8796a9] transition hover:bg-[#111923] hover:text-white"><Target className="h-4 w-4 text-[#1677ff]" /><span className="flex-1">Tracker.gg</span><ExternalLink className="h-3.5 w-3.5 text-[#52647b]" /></a><a href={tpgUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[#8796a9] transition hover:bg-[#111923] hover:text-white"><Trophy className="h-4 w-4 text-[#ff7a18]" /><span className="flex-1">Torneos Pro Gamers</span><ExternalLink className="h-3.5 w-3.5 text-[#52647b]" /></a></div><div className="border-t border-[#182536] p-4"><div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#a8ff2a] shadow-[0_0_10px_#a8ff2a]" /><span className="text-xs font-semibold text-[#c3ceda]">Sistema operativo</span></div>{user ? <div className="flex items-center gap-2 rounded-lg bg-[#101821] p-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e6293f] text-xs font-bold text-white">{user.name?.charAt(0).toUpperCase() ?? "C"}</span><span className="truncate text-xs text-[#aab7c6]">{user.name}</span></div> : <button onClick={() => startLogin()} className="focus-ring w-full rounded-lg border border-[#2d4057] bg-[#121c28] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#b8c7d8] hover:border-[#e6293f] hover:text-white">Conectar cuenta</button>}</div></div></aside>
    {mobileNav && <button aria-label="Cerrar navegación" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" />}
    <div className="lg:pl-[260px]"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#182536] bg-[#080c12]/90 px-4 backdrop-blur-md md:px-8"><div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} className="focus-ring rounded-lg border border-[#26364b] p-2 text-[#97a6b8] lg:hidden"><Menu className="h-5 w-5" /></button><div><div className="eyebrow hidden md:block">CROSAIM / {section === "overview" ? "CONTROL ROOM" : section.toUpperCase()}</div><div className="text-sm font-semibold text-white md:hidden">{activeLabel}</div></div></div><div className="flex items-center gap-2 md:gap-4"><div className="hidden items-center gap-2 text-xs text-[#7d8da1] md:flex"><Clock3 className="h-3.5 w-3.5" /> 08 SEP 2026 · VET</div><IconButton label="Buscar"><Search className="h-4 w-4" /></IconButton><IconButton label="Ayuda"><CircleHelp className="h-4 w-4" /></IconButton><button onClick={() => user ? undefined : startLogin()} className="focus-ring hidden items-center gap-2 rounded-lg border border-[#2a3a4e] bg-[#121b27] px-3 py-2 text-xs font-semibold text-[#b8c6d4] transition hover:border-[#536b89] hover:text-white sm:flex">{user ? <><span className="h-2 w-2 rounded-full bg-[#a8ff2a]" /> Cuenta conectada</> : <><Command className="h-3.5 w-3.5" /> Conectar</>}</button></div></header><main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">{section === "overview" && <Overview setSection={setSection} players={players} content={content} />}{section === "roster" && <Roster players={players} setPlayers={setPlayers} />}{section === "tournaments" && <Tournaments />}{section === "content" && <ContentBoard content={content} setContent={setContent} />}{section === "analytics" && <Analytics />}<footer className="mt-10 flex flex-col justify-between gap-2 border-t border-[#172434] pt-5 text-[10px] uppercase tracking-[.14em] text-[#54647a] md:flex-row"><span>CROSAIM / Operations Center · 2026</span><span>Construido para entrenar · analizar · competir</span></footer></main></div>
  </div>;
}
