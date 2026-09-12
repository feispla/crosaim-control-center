import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import PolicyPage, { PolicySection } from "./components/PolicyPage";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Privacy() {
  return (
    <PolicyPage
      eyebrow="CROSAIM · Legal"
      title="Política de privacidad"
      intro="Esta página explica, de forma clara, qué información puede utilizar CROSAIM para prestar sus servicios, cómo se utiliza y qué controles debe tener el usuario. El texto deberá revisarse con asesoría legal antes de publicarse como documento definitivo."
    >
      <PolicySection title="1. Información que puede recopilarse">
        <p>CROSAIM puede procesar datos de cuenta, identificadores de Discord, información de perfil competitivo, preferencias, datos de postulaciones, actividad dentro de las funciones del servicio y datos técnicos necesarios para seguridad y funcionamiento.</p>
        <p>No se solicita información que no sea necesaria para la función correspondiente. Los secretos, contraseñas y tokens privados no deben introducirse en formularios públicos.</p>
      </PolicySection>
      <PolicySection title="2. Para qué se utiliza">
        <p>La información puede utilizarse para autenticar usuarios, gestionar perfiles y rosters, procesar postulaciones, operar integraciones con Discord, mantener la seguridad, prestar funciones del juego y mejorar la experiencia del ecosistema CROSAIM.</p>
      </PolicySection>
      <PolicySection title="3. Discord y cuentas vinculadas">
        <p>Cuando un usuario conecta Discord, CROSAIM puede recibir los datos que el flujo de autorización permita. La conexión debe utilizarse únicamente para las finalidades informadas y con el alcance mínimo necesario.</p>
      </PolicySection>
      <PolicySection title="4. Conservación y seguridad">
        <p>Los datos deben conservarse durante el tiempo necesario para la finalidad correspondiente y protegerse mediante controles de acceso, gestión segura de secretos, validación de entradas y separación entre información pública y privada.</p>
      </PolicySection>
      <PolicySection title="5. Derechos y contacto">
        <p>Las solicitudes relacionadas con privacidad pueden dirigirse a feispla@zohomail.com. Las solicitudes podrán requerir verificación razonable para proteger la cuenta y la información de terceros.</p>
      </PolicySection>
    </PolicyPage>
  );
}

function Terms() {
  return (
    <PolicyPage eyebrow="CROSAIM · Legal" title="Términos de uso" intro="Reglas generales para utilizar el Control Center, el bot, las funciones competitivas y los servicios futuros de CROSAIM.">
      <PolicySection title="1. Uso aceptable"><p>El usuario debe utilizar CROSAIM de forma legal, respetuosa y compatible con las reglas de las plataformas integradas. No está permitido intentar acceder sin autorización a cuentas, datos, sistemas o funciones administrativas.</p></PolicySection>
      <PolicySection title="2. Comunidad y competición"><p>Las postulaciones, tryouts, rosters, torneos y resultados pueden estar sujetos a revisión. CROSAIM puede limitar funciones cuando sea necesario para proteger a la comunidad, la competición o la seguridad del servicio.</p></PolicySection>
      <PolicySection title="3. Integraciones"><p>Las funciones conectadas a Discord, Tracker.gg, TPG u otros servicios dependen también de las reglas y disponibilidad de dichos servicios.</p></PolicySection>
      <PolicySection title="4. Cambios"><p>El ecosistema CROSAIM está en desarrollo. Las funciones, integraciones y políticas pueden actualizarse cuando sea necesario, comunicando cambios relevantes de forma razonable.</p></PolicySection>
    </PolicyPage>
  );
}

function Community() {
  return (
    <PolicyPage eyebrow="CROSAIM · Community" title="Normas de la comunidad" intro="Una comunidad competitiva necesita reglas claras, moderación consistente y un entorno donde jugadores, staff, creadores y organizadores puedan participar con respeto.">
      <PolicySection title="1. Respeto"><p>No se toleran acoso, amenazas, discriminación, ataques personales, doxxing ni campañas dirigidas contra otros miembros.</p></PolicySection>
      <PolicySection title="2. Juego limpio"><p>No se permite hacer trampa, abusar de exploits, manipular resultados, suplantar identidades o intentar obtener ventajas mediante métodos no autorizados.</p></PolicySection>
      <PolicySection title="3. Privacidad"><p>No publiques información personal de otra persona sin autorización. Las capturas, clips, perfiles y datos de postulantes deben compartirse únicamente cuando corresponda.</p></PolicySection>
      <PolicySection title="4. Moderación"><p>El staff puede investigar reportes, retirar contenido, limitar canales o aplicar medidas proporcionales. Los incidentes de seguridad deben comunicarse por los canales indicados en la política de seguridad y no mediante publicaciones públicas con credenciales o secretos.</p></PolicySection>
      <PolicySection title="5. Reportes"><p>Para reportes de seguridad: feispla@zohomail.com. Para asuntos comunitarios, utiliza el servidor oficial de Discord de CROSAIM.</p></PolicySection>
    </PolicyPage>
  );
}

function Security() {
  return (
    <PolicyPage eyebrow="CROSAIM · Security" title="Seguridad" intro="CROSAIM aplica un enfoque de mínimo privilegio y protección de credenciales. Las vulnerabilidades no deben divulgarse públicamente antes de que puedan investigarse.">
      <PolicySection title="Reportar una vulnerabilidad"><p>Envía una descripción clara, componente afectado, pasos de reproducción e impacto potencial a feispla@zohomail.com. No incluyas contraseñas, tokens, claves API ni secretos.</p></PolicySection>
      <PolicySection title="Buenas prácticas"><p>CROSAIM prioriza autenticación segura, autorización por roles, secretos mediante variables de entorno, validación de entradas, protección de APIs, mantenimiento de dependencias y separación de datos públicos y privados.</p></PolicySection>
    </PolicyPage>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/community" component={Community} />
      <Route path="/security" component={Security} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
