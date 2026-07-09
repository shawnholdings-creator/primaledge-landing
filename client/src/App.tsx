import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LoginModalProvider } from "./contexts/LoginModalContext";
import LoginModal from "./components/LoginModal";
import GlobalDisclaimer from "./components/GlobalDisclaimer";
import MobileCTA from "./components/MobileCTA";
import { useEffect, lazy, Suspense } from "react";

/* Lazy-loaded pages — each page is its own JS chunk, loaded only when visited */
const Home = lazy(() => import("./pages/Home"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Products = lazy(() => import("./pages/Products"));
const Charts = lazy(() => import("./pages/Charts"));
const Education = lazy(() => import("./pages/Education"));
const Podcasts = lazy(() => import("./pages/Podcasts"));
const References = lazy(() => import("./pages/References"));
const MarketSentiment = lazy(() => import("./pages/MarketSentiment"));
const Sectors = lazy(() => import("./pages/Sectors"));
const DevRequests = lazy(() => import("./pages/DevRequests"));
const AIDashboard = lazy(() => import("./pages/AIDashboard"));
const OptionsDashboard = lazy(() => import("./pages/OptionsDashboard"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));
const WeeklyIncome = lazy(() => import("./pages/WeeklyIncome"));
const NotFound = lazy(() => import("./pages/NotFound"));

/* Minimal full-screen loading state shown while a page chunk downloads */
function PageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1118",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid rgba(0,229,160,0.2)",
          borderTopColor: "#00e5a0",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* Scroll to top on every route change */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path={"/weekly-income"} component={WeeklyIncome} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <LoginModalProvider>
            <TooltipProvider>
              <Toaster />
              <ScrollToTop />
              <Router />
              <MobileCTA />
              <GlobalDisclaimer />
              <LoginModal />
            </TooltipProvider>
          </LoginModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
