import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Navigate, Routes, useNavigate } from "react-router-dom";

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

initializeMixpanel();

// Create a client
const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>    
      <Provider store={store}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProviderWrapper>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Routes>
                  <Route path="/app" element={<MapApp />} />
                  {!constants.VITE_FEATURE_USE_BETTERAUTH ? <Route path="/app/my-account/*" element={<MyAccount />} /> : null }
                  <Route path="/auth/*" element={<Authentication />} />
                  <Route path="/" element={<Navigate to="/app" replace={true} />} />
                  <Route path="*" element={<FourOhFour />} />
                </Routes>
              </ErrorBoundary>
            </AuthProviderWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </Provider>    
  </QueryClientProvider>,
);
