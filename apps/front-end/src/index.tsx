import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Navigate, Routes } from "react-router-dom";

import MapApp from "./pages/MapApp";
import MyAccount from "./pages/MyAccount";
import FourOhFour from "./pages/FourOhFour";
import Authentication from "./pages/Authentication";
import ErrorFallback from "./pages/ErrorFallback";
import { ErrorBoundary } from "react-error-boundary";
import store from "./store";
import { initializeMixpanel } from "./analytics";

// Styles
import "./tailwind.css";
import "./index.css";
import "./assets/styles/style.scss";
import { TooltipProvider } from "./components/ui/tooltip";
import constants from "./constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthProviderWrapper from "./providers/AuthProviderWrapper";
import { Toaster } from "./components/ui/sonner";
import RequireAuth from "./components/layouts/RequireAuth";

initializeMixpanel();

// Create a client
const queryClient = new QueryClient()

const RoutesLegacy = () => {
  return (
    <Routes>
      <Route path="/app" element={<MapApp />} />
      <Route path="/app/my-account/*" element={<MyAccount />} />
      <Route path="/auth/*" element={<Authentication />} />
      <Route path="/" element={<Navigate to="/app" replace={true} />} />
      <Route path="*" element={<FourOhFour />} />
    </Routes>
  )
}

const RoutesNew = () => {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<MapApp />} />
        <Route path="/app/my-account/*" element={<MyAccount />} /> {/* // TODO this will change} */}
      </Route>
      <Route path="/auth/*" element={<Authentication />} />
      <Route path="/" element={<Navigate to="/app" replace={true} />} />
      <Route path="*" element={<FourOhFour />} />
    </Routes>
  )
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>    
      <Provider store={store}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProviderWrapper>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                {constants.VITE_FEATURE_USE_BETTERAUTH ? <RoutesNew/> : <RoutesLegacy/>}                
              </ErrorBoundary>
              <Toaster />
            </AuthProviderWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </Provider>    
  </QueryClientProvider>,
);


