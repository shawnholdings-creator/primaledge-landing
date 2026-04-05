import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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
      <Route path={"/404"} component={NotFound} />
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
