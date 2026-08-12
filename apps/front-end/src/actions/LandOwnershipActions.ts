import { getRequest } from "./RequestActions";
import { autoSave } from "./MapActions";
import { Polygon } from "geojson";
import {
  PolygonGeom,
  Property,
  PropertyDisplayType,
} from "@/reducers/LandOwnershipReducer";
import { LEFT_PANE_TRAY } from "@/reducers/LeftPaneReducer";

type OwnershipPolygon = { polyId: number; geom: unknown };

type ProprietorOwnership = {
  titleNumber: string;
  address: string | null;
  polygons: OwnershipPolygon[];
};

type ProprietorOwnershipsResponse = {
  proprietorName: string | null;
  companyRegNumber: string | null;
  year: number;
  ownerships: ProprietorOwnership[];
  totalResults: number;
};

export const fetchPropertiesInBox = (
  sw_lng: number,
  sw_lat: number,
  ne_lng: number,
  ne_lat: number,
) => {
  return async (dispatch: any, getState: any) => {
    dispatch({ type: "SET_LOADING_PROPERTIES", payload: true });

    const propertiesType = getState().landOwnership.activeDisplay;

    const properties = propertiesType
      ? await dispatch(
          getRequest(
            `/api/ownership?sw_lng=${sw_lng}&sw_lat=${sw_lat}&ne_lng=${ne_lng}&ne_lat=${ne_lat}&type=${propertiesType}`,
          ),
        )
      : null;

    if (properties) {
      dispatch({ type: "SET_VISIBLE_PROPERTIES", payload: properties });
      dispatch({ type: "SET_LOADING_PROPERTIES", payload: false });
    }
  };
};

export const highlightProperties = (properties: any) => {
  return (dispatch: any) => {
    dispatch({
      type: "HIGHLIGHT_PROPERTIES",
      payload: properties,
    });
  };
};

export const clearHighlightedProperties = (propertyTitleNos: string[]) => {
  return (dispatch: any) => {
    dispatch({
      type: "CLEAR_HIGHLIGHTED_PROPERTIES",
      payload: propertyTitleNos,
    });
  };
};

export const clearAllHighlightedProperties = () => {
  return (dispatch: any) => {
    dispatch({
      type: "CLEAR_ALL_HIGHLIGHTED_PROPERTIES",
    });
  };
};

export const setActiveProperty = (titleNo: string) => {
  return (dispatch: any, getState: any) => {
    // First clear the active property to trigger scroll to the property, even if it was already
    // active
    dispatch({
      type: "SET_ACTIVE_PROPERTY",
      payload: null,
    });
    dispatch({
      type: "SET_ACTIVE_PROPERTY",
      payload: titleNo,
    });
    dispatch({
      type: "SET_ACTIVE",
      payload: LEFT_PANE_TRAY.LAND_INFORMATION,
    });
    console.log(
      "setActiveProperty",
      getState().landOwnership.highlightedProperties[titleNo],
    );
  };
};

// Tracks the AbortController for the most recent related-properties request, shared by every
// caller below (slider year change, proprietor selection, retry). This guarantees a slower,
// superseded request can never overwrite the state written by a request started after it,
// regardless of which call site triggered either request.
let latestOwnershipRequestController: AbortController | null = null;

const startOwnershipRequest = (): AbortController => {
  latestOwnershipRequestController?.abort();
  const controller = new AbortController();
  latestOwnershipRequestController = controller;
  return controller;
};

export const fetchPropertyOwnerships = (
  selectedYear: number,
  currentYear: number,
  proprietorName: string,
) => {
  return async (dispatch: any) => {
    if (selectedYear === currentYear) {
      dispatch(fetchRelatedProperties(proprietorName));
    } else {
      dispatch(fetchPropertyOwnershipByYear(selectedYear, proprietorName));
    }
  };
};

// This method fetches related properties for the current year
export const fetchRelatedProperties = (proprietorName: string) => {
  return async (dispatch: any) => {
    const controller = startOwnershipRequest();

    dispatch({
      type: "SET_RELATED_PROPERTIES_YEAR",
      payload: new Date().getFullYear(),
    }); // set the date back to the current year

    dispatch({
      type: "SET_RELATED_PROPERTIES_PROPRIETOR_NAME",
      payload: proprietorName,
    });
    // A prior search may have left polygons on the map for a different proprietor or year - clear
    // them out immediately, rather than leaving them up until this search resolves.
    dispatch({ type: "CLEAR_RELATED_PROPERTIES" });
    dispatch({ type: "FETCH_RELATED_PROPERTIES_LOADING" });

    const relatedPropertiesTitleMap = await dispatch(
      getRequest(
        `/api/search?proprietorName=${encodeURIComponent(proprietorName)}`,
        controller.signal,
      ),
    );

    // A newer request has superseded this one - let it own the state update.
    if (controller !== latestOwnershipRequestController) {
      return;
    }

    if (relatedPropertiesTitleMap !== null) {
      dispatch({
        type: "FETCH_RELATED_PROPERTIES_SUCCESS",
        payload: relatedPropertiesTitleMap,
      });
    } else {
      dispatch({
        type: "FETCH_RELATED_PROPERTIES_FAILURE",
        payload: "Error fetching related properties",
      });
    }
  };
};

export const fetchPropertyOwnershipByYear = (
  year: number,
  proprietorName: string,
  companyRegNum?: string,
) => {
  return async (dispatch: any) => {
    const controller = startOwnershipRequest();

    // A prior search may have left polygons on the map for a different proprietor or year - clear
    // them out immediately, rather than leaving them up until this search resolves.
    dispatch({ type: "CLEAR_RELATED_PROPERTIES" });
    dispatch({ type: "FETCH_RELATED_PROPERTIES_LOADING" });

    let url;
    if (companyRegNum) {
      url = `/api/proprietors/ownerships?year=${year}&proprietorName=${encodeURIComponent(
        proprietorName,
      )}&companyRegNo=${encodeURIComponent(companyRegNum)}`;
    } else {
      url = `/api/proprietors/ownerships?year=${year}&proprietorName=${encodeURIComponent(
        proprietorName,
      )}`;
    }

    const propertyOwnershipsForYear: ProprietorOwnershipsResponse | null =
      await dispatch(getRequest(url, controller.signal));

    // A newer request has superseded this one - let it own the state update.
    if (controller !== latestOwnershipRequestController) {
      return;
    }

    if (propertyOwnershipsForYear !== null) {
      let payload;
      if (propertyOwnershipsForYear.ownerships.length > 0) {
        // map the results into a { [titleNo]: Property } map
        payload = propertyOwnershipsForYear.ownerships.reduce(
          (
            acc: { [titleNo: string]: Partial<Property> },
            x: ProprietorOwnership,
          ) => {
            const polygons: PolygonGeom[] = x.polygons.map((p) => ({
              poly_id: String(p.polyId),
              geom: p.geom as Polygon,
            }));
            acc[x.titleNumber] = {
              id: "",
              title_no: x.titleNumber,
              polygons,
              property_address: x.address ?? "",
            };
            return acc;
          },
          {},
        );
      } else {
        payload = {};
      }
      dispatch({
        type: "FETCH_RELATED_PROPERTIES_SUCCESS",
        payload: payload,
      });
    } else {
      dispatch({
        type: "FETCH_RELATED_PROPERTIES_FAILURE",
        payload: "Error fetching historic properties",
      });
    }
  };
};

export const togglePropertyDisplay = (type: PropertyDisplayType) => {
  return (dispatch: any) => {
    dispatch({ type: "TOGGLE_PROPERTY_DISPLAY", payload: type });
    return dispatch(autoSave());
  };
};
