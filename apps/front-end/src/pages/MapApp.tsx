import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { useNavigate } from "react-router-dom";
import MapboxMap from "../components/map/MapboxMap";
import TopBar from "../components/top-bar/TopBar";
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
import { useSession } from "@better-auth-ui/react";
import { authClient } from "@/lib/auth/auth-client";

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
            Controls - map and layer controls in bottom right of app
         */
    return (
      <div className="h-screen min-h-screen flex flex-col">
        <MapboxMap />
        <TopBar limited={false} />
        <NoConnectionToast />
        <ControlButtons />
        <Tooltips />
      </div>
    );
  } else {
    return (
      <div className="h-screen min-h-screen flex flex-col items-center justify-center grow">
        <TopBar limited={true} />
        <Spinner className="text-primary size-8 items-center"></Spinner>
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
  const { data: session } = useSession(authClient);

  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      if (!session) {
        return; // This will be changed in a later PR to redirect to sign in page
      }

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
