import { Bell, BarChart3, CalendarDays, Clock3, History, Radio, RefreshCw, Send, Shield, Swords, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const templates = [
  { id: "scrim", label: "Scrim", icon: Swords, title: "Scrim confirmado", detail: "El scrim del equipo está confirmado. Revisa el horario y entra al canal operativo.", severity: "info" as const },
  { id: "tryout", label: "Tryout", icon: Users, title: "Nuevo tryout CROSAIM", detail: "Hay una evaluación pendiente. Revisa el perfil del jugador y coordina la entrevista.", severity: "warning" as const },
  { id: "tournament", label: "Torneo", icon: Trophy, title: "Aviso de torneo", detail: "Hay una actualización importante sobre el próximo torneo TPG. Revisa el calendario del equipo.", severity: "urgent" as const },
];

type Severity = "info" | "success" | "warning" | "urgent";

export default function AdminPushPanel() {
  const utils = trpc.useUtils();
  const subscribers = trpc.adminPush.subscribers.useQuery(undefined, { retry: false });
  const stats = trpc.adminPush.stats.useQuery(undefined, { retry: false });
  const history = trpc.adminPush.history.useQuery(undefined, { retry: false });
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [severity, setSeverity] = useState<Severity>("info");
  const [target, setTarget] = useState("all");
  const [feedback, setFeedback] = useState("");
  const sendAlert = trpc.adminPush.send.useMutation({
    onSuccess: () => {
      setFeedback("Alerta enviada correctamente y registrada en el historial.");
      setTitle("");
      setDetail("");
      void Promise.all([
        utils.adminPush.subscribers.invalidate(),
        utils.adminPush.stats.invalidate(),
        utils.adminPush.history.invalidate(),
      ]);
    },
  });

  const rows = subscribers.data ?? [];
  const uniqueUsers = Array.from(new Map(rows.map((row) => [row.userId, row])).values());
  const metric = stats.data;
  const applyTemplate = (template: typeof templates[number]) => {
    setTitle(template.title);
    setDetail(template.detail);
    setSeverity(template.severity);
    setFeedback(`Plantilla ${template.label} cargada. Personaliza el mensaje si lo necesitas.`);
  };
  const submit = () => {
    if (!title.trim() || !detail.trim() || sendAlert.isPending) return;
    setFeedback("");
    sendAlert.mutate({ title: title.trim(), detail: detail.trim(), severity, targetUserId: target === "all" ? null : Number(target) });
  };

  return (
    <div>
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="eyebrow mb-2">Seguridad · administración</div>
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">Centro de alertas</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#93a1b2]">Gestiona suscripciones, envía avisos rápidos y conserva un registro de cada comunicación del equipo.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#456c30] bg-[#172817] px-3 py-2 text-xs font-bold uppercase tracking-[.1em] text-[#b9ff78]"><Shield className="h-4 w-4" /> Solo admin</div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Suscripciones activas" value={metric?.activeSubscriptions ?? rows.length} note="dispositivos registrados" color="text-[#73b2ff]" />
        <Metric label="Cuentas con Push" value={metric?.uniqueUsers ?? uniqueUsers.length} note="personas alcanzables" color="text-[#d2a8ff]" />
        <Metric label="Alertas enviadas" value={metric?.alertsSent ?? 0} note="registradas en historial" color="text-[#ffad69]" />
        <Metric label="Entrega registrada" value={`${metric?.deliveryRate ?? 0}%`} note="envíos con destino válido" color="text-[#b9ff78]" />
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="panel p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#73b2ff]"><BarChart3 className="h-4 w-4" /> Resumen de entregas</div><div className="mt-3 flex flex-wrap gap-4 text-sm"><span className="text-[#b9ff78]">Enviadas: {metric?.delivered ?? 0}</span><span className="text-[#ffad69]">Parciales: {metric?.partial ?? 0}</span><span className="text-[#ff8994]">Fallidas: {metric?.failed ?? 0}</span></div></div>
        <div className="panel p-4 md:col-span-2"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#d2a8ff]"><History className="h-4 w-4" /> Comunicación sincronizada</div><p className="mt-3 text-xs leading-5 text-[#9caabd]">Cada alerta se guarda en la base de datos, genera una notificación interna y se replica en Discord mediante el webhook configurado.</p></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="panel p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between"><div><div className="eyebrow mb-2">Compositor</div><h2 className="font-display text-2xl font-bold uppercase text-white">Enviar alerta Push</h2></div><Radio className="h-5 w-5 text-[#9b3dff]" /></div>
          <div className="mb-5"><div className="eyebrow mb-2">Plantillas rápidas</div><div className="grid grid-cols-3 gap-2">{templates.map((template) => <button key={template.id} onClick={() => applyTemplate(template)} className="focus-ring flex flex-col items-center gap-2 rounded-lg border border-[#2c3c50] bg-[#0a1018] px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[.08em] text-[#b9c6d4] transition hover:border-[#9b3dff] hover:text-white"><template.icon className="h-4 w-4 text-[#9b3dff]" />{template.label}</button>)}</div></div>
          <div className="space-y-3">
            <label className="block"><span className="eyebrow mb-2 block text-[#d2a8ff]">Destinatario</span><select value={target} onChange={(event) => setTarget(event.target.value)} className="focus-ring w-full rounded-lg border border-[#2c3c50] bg-[#0a1018] px-3 py-2.5 text-sm text-white"><option value="all">Todos los suscriptores ({rows.length})</option>{uniqueUsers.map((row) => <option key={row.userId} value={row.userId}>{row.name} · {row.email}</option>)}</select></label>
            <label className="block"><span className="eyebrow mb-2 block text-[#d2a8ff]">Título</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Ej. Scrim confirmado para hoy" className="focus-ring w-full rounded-lg border border-[#2c3c50] bg-[#0a1018] px-3 py-2.5 text-sm text-white placeholder:text-[#637287]" /></label>
            <label className="block"><span className="eyebrow mb-2 block text-[#d2a8ff]">Mensaje</span><textarea value={detail} onChange={(event) => setDetail(event.target.value)} maxLength={1000} rows={4} placeholder="Escribe el aviso que aparecerá en el navegador y Discord..." className="focus-ring w-full resize-none rounded-lg border border-[#2c3c50] bg-[#0a1018] px-3 py-2.5 text-sm text-white placeholder:text-[#637287]" /></label>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="block"><span className="eyebrow mb-2 block text-[#d2a8ff]">Prioridad</span><select value={severity} onChange={(event) => setSeverity(event.target.value as Severity)} className={classNames("focus-ring w-full rounded-lg border bg-[#0a1018] px-3 py-2.5 text-sm", severity === "urgent" ? "border-[#74303b] text-[#ff8994]" : severity === "warning" ? "border-[#704523] text-[#ffad69]" : "border-[#2c3c50] text-white")}><option value="info">Informativa</option><option value="success">Éxito</option><option value="warning">Advertencia</option><option value="urgent">Urgente</option></select></label><button onClick={submit} disabled={sendAlert.isPending || !title.trim() || !detail.trim() || rows.length === 0} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[#9b3dff] px-4 py-2.5 text-xs font-bold uppercase tracking-[.1em] text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /> {sendAlert.isPending ? "Enviando..." : "Enviar alerta"}</button></div>
            {sendAlert.error && <p className="mt-3 text-xs text-[#ff8994]">{sendAlert.error.message}</p>}{feedback && <p className="mt-3 text-xs text-[#b9ff78]">{feedback}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <SubscriberList rows={rows} loading={subscribers.isLoading} error={Boolean(subscribers.error)} onRefresh={() => void subscribers.refetch()} refreshing={subscribers.isFetching} />
          <AlertHistory rows={history.data ?? []} loading={history.isLoading} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, note, color }: { label: string; value: string | number; note: string; color: string }) {
  return <div className="panel p-4"><div className="eyebrow">{label}</div><div className="mt-3 font-display text-3xl font-bold text-white">{value}</div><div className={classNames("mt-1 text-xs", color)}>{note}</div></div>;
}

function SubscriberList({ rows, loading, error, onRefresh, refreshing }: { rows: Array<{ id: number; userId: number; name: string; email: string; subscribedAt: Date | string }>; loading: boolean; error: boolean; onRefresh: () => void; refreshing: boolean }) {
  return <div className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#202e3e] bg-[#101724] px-5 py-4"><div><div className="eyebrow mb-1 text-[#73b2ff]">Audiencia Push</div><h2 className="font-display text-2xl font-bold uppercase text-white">Suscriptores</h2></div><button onClick={onRefresh} className="focus-ring rounded-lg border border-[#2c3c50] p-2 text-[#93a1b2] hover:text-white" aria-label="Actualizar suscriptores"><RefreshCw className={classNames("h-4 w-4", refreshing && "animate-spin")} /></button></div><div className="max-h-[330px] divide-y divide-[#1c2938] overflow-y-auto">{loading && <div className="p-5 text-sm text-[#9caabd]">Cargando suscriptores...</div>}{error && <div className="p-5 text-sm text-[#ff8994]">No tienes permisos para ver este panel.</div>}{!loading && !rows.length && <div className="p-5 text-sm text-[#9caabd]">Todavía no hay dispositivos suscritos.</div>}{rows.map((row) => <div key={row.id} className="flex items-center gap-3 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#102640] text-[#73b2ff]"><Users className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white">{row.name}</div><div className="truncate text-xs text-[#8291a4]">{row.email} · {new Date(row.subscribedAt).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" })}</div></div><Bell className="h-4 w-4 text-[#9b3dff]" /></div>)}</div></div>;
}

function AlertHistory({ rows, loading }: { rows: Array<{ id: number; title: string; severity: Severity; targetMode: "all" | "user"; recipientCount: number; subscriptionCount: number; deliveryStatus: "sent" | "partial" | "failed"; sentAt: Date | string }>; loading: boolean }) {
  return <div className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#202e3e] bg-[#101724] px-5 py-4"><div><div className="eyebrow mb-1 text-[#ffad69]">Auditoría</div><h2 className="font-display text-2xl font-bold uppercase text-white">Historial enviado</h2></div><Clock3 className="h-5 w-5 text-[#ffad69]" /></div><div className="max-h-[360px] divide-y divide-[#1c2938] overflow-y-auto">{loading && <div className="p-5 text-sm text-[#9caabd]">Cargando historial...</div>}{!loading && !rows.length && <div className="p-5 text-sm text-[#9caabd]">Aún no hay alertas enviadas.</div>}{rows.map((item) => <div key={item.id} className="px-5 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{item.title}</div><div className="mt-1 text-xs text-[#8291a4]">{item.targetMode === "all" ? "Todos" : "Usuario seleccionado"} · {item.recipientCount} cuentas · {item.subscriptionCount} dispositivos</div></div><span className={classNames("shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase", item.deliveryStatus === "sent" ? "border-[#456c30] bg-[#172817] text-[#b9ff78]" : item.deliveryStatus === "partial" ? "border-[#704523] bg-[#2b1b10] text-[#ffad69]" : "border-[#74303b] bg-[#35171f] text-[#ff8994]")}>{item.deliveryStatus}</span></div><div className="mt-2 flex items-center gap-2 text-[10px] text-[#68798e]"><CalendarDays className="h-3.5 w-3.5" />{new Date(item.sentAt).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" })}<span>·</span><span className="uppercase">{item.severity}</span></div></div>)}</div></div>;
}
