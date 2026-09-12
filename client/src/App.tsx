import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import InfoPage from "./pages/InfoPages";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/privacy"><InfoPage kind="privacy" /></Route>
      <Route path="/terms"><InfoPage kind="terms" /></Route>
      <Route path="/community"><InfoPage kind="community" /></Route>
      <Route path="/security"><InfoPage kind="security" /></Route>
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
