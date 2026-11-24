import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import MapboxMap from "../components/map/MapboxMap";
import TopBar from "../components/top-bar/TopBar";
import Tooltips from "../components/common/Tooltips";
import ControlButtons from "../components/map-controls/ControlButtons";
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
const MapApp = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    let unmounted = false;

    (async () => {
      await dispatch(getUserDetails());
      // Don't open a socket if we left the page while user details were loading
      if (unmounted) return;
      dispatch(establishSocketConnection());
      dispatch(getAskForFeedback());
      await dispatch(getMyMaps());

      // Open the map that was previously open if the page was refreshed
      const storedMapId = parseInt(sessionStorage.getItem("currentMapId") ?? "");
      if (storedMapId) {
        await dispatch(openMap(storedMapId));
      }
    })();

    // Close the socket when leaving the map page, so it can't stay connected
    // (and in a map room, possibly holding its lock) after a client-side
    // navigation, e.g. a future sign-out that doesn't do a full page reload
    return () => {
      unmounted = true;
      dispatch(closeSocketConnection());
    };
  }, [dispatch]);

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

export default MapApp;
