import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Subscribe from "./pages/Subscribe";
import Products from "./pages/Products";
import Charts from "./pages/Charts";
import Education from "./pages/Education";
import Podcasts from "./pages/Podcasts";
import References from "./pages/References";
import MarketSentiment from "./pages/MarketSentiment";
import Sectors from "./pages/Sectors";
import DevRequests from "./pages/DevRequests";
import AIDashboard from "./pages/AIDashboard";
import OptionsDashboard from "./pages/OptionsDashboard";
import ComingSoonPage from "./pages/ComingSoonPage";
import GlobalDisclaimer from "./components/GlobalDisclaimer";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/subscribe"} component={Subscribe} />
      <Route path={"/products"} component={Products} />
      <Route path={"/charts"} component={Charts} />
      <Route path={"/education"} component={Education} />
      <Route path={"/podcasts"} component={Podcasts} />
      <Route path={"/references"} component={References} />
      <Route path={"/market-sentiment"} component={MarketSentiment} />
      <Route path={"/sectors"} component={Sectors} />
      <Route path={"/dev-requests"} component={DevRequests} />
      <Route path={"/ai-dashboard"} component={AIDashboard} />
      <Route path={"/options-prep"} component={OptionsDashboard} />
      <Route path={"/weekly-income"} component={ComingSoonPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <GlobalDisclaimer />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
