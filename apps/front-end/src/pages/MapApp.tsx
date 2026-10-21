import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { useNavigate } from "react-router-dom";
import MapboxMap from "../components/map/MapboxMap";
import TopBar from "../components/top-bar/TopBar";
import PlatformUpdateBanner from "../components/top-bar/PlatformUpdateBanner";
import Tooltips from "../components/common/Tooltips";
import ControlButtons from "../components/map-controls/ControlButtons";
import * as Auth from "../utils/Auth";
import { getMyMaps, openMap } from "../actions/MapActions";
import { getUserDetails, getAskForFeedback } from "../actions/UserActions";
import NoConnectionToast from "../components/map/NoConnectionToast";
import {
  establishSocketConnection,
  closeSocketConnection,
} from "../actions/WebSocketActions";
import constants from "@/constants";
import { Spinner } from "@/components/ui/spinner";
/**
 * Renders the map once the user's details have loaded, and a spinner until then.
 *
 * Both auth variants below share this, so the only thing that differs between
 * them is how the session is established.
 */
const MapAppShell = () => {
  const user = useAppSelector((state) => state.user);

  // If user details have been populated, render map, else render loading spinner
  if (user.populated) {
    /*
            Tooltips - hover tooltips for buttons
            MapboxMap - MapboxGL instance, drawing tools, left pane, ui etc.
            TopBar - navigation bar at top of page
            PlatformUpdateBanner - warning under the top bar about the upcoming
              login change, so only shown while still on the legacy auth
            Controls - map and layer controls in bottom right of app
         */
    return (
      <div className="flex h-dvh flex-col">
        <TopBar limited={false} />
        {!constants.VITE_FEATURE_USE_BETTERAUTH && <PlatformUpdateBanner />}
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <MapboxMap />
          <NoConnectionToast />
          <ControlButtons />
          <Tooltips />
        </main>
      </div>
    );
  } else {
    return (
      <div className="flex h-dvh flex-col">
        <TopBar limited={true} />
        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <Spinner className="text-primary size-8"></Spinner>
        </main>
      </div>
    );
  }
};

// TODO: Remove this component as part of the clean up of VITE_FEATURE_USE_BETTERAUTH feature flag
const MapAppLegacy = () => {
  const authenticated = useAppSelector(
    (state) => state.authentication.authenticated
  );

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (authenticated && Auth.isTokenActive()) {
        // If authenticated, get user details, setup websocket connection, and get maps
        await dispatch(getUserDetails());
        dispatch(establishSocketConnection());
        dispatch(getAskForFeedback());
        await dispatch(getMyMaps());

        // Open the map that was previously open if the page was refreshed
        const storedMapId = parseInt(
          sessionStorage.getItem("currentMapId") ?? ""
        );
        if (storedMapId) {
          await dispatch(openMap(storedMapId));
        }
      } else {
        // If not authenticated, remove token, disconnect websocket, and redirect
        // to login page
        Auth.removeToken();
        dispatch(closeSocketConnection());
        sessionStorage.removeItem("currentMapId");
        console.log("no token, redirecting to login page");
        navigate("/auth", { replace: true });
      }
    })();
  }, [authenticated]);

  return <MapAppShell />;
};

const MapAppBetterAuth = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      await dispatch(getUserDetails());
      dispatch(establishSocketConnection());
      dispatch(getAskForFeedback());
      await dispatch(getMyMaps());

      // Open the map that was previously open if the page was refreshed
      const storedMapId = parseInt(sessionStorage.getItem("currentMapId") ?? "");
      if (storedMapId) {
        await dispatch(openMap(storedMapId));
      }
    })();
  }, [dispatch]);
  return <MapAppShell />;
};

// The flag is a build-time constant, so pick the variant once at module load.
// Branching inside a single component would mean calling hooks conditionally.
const MapApp = constants.VITE_FEATURE_USE_BETTERAUTH
  ? MapAppBetterAuth
  : MapAppLegacy;

export default MapApp;
