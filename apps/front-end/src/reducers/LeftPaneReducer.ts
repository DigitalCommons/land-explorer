import { Action } from "../types";

export const LEFT_PANE_TRAY = {
  NONE: "",
  DRAWING_TOOLS: "Drawing Tools",
  LAND_DATA: "Land Data",
  LAND_INFORMATION: "Land Information",
  OWNERSHIP_SEARCH: "Ownership Search",
} as const;

export type LeftPaneTrayId = (typeof LEFT_PANE_TRAY)[keyof typeof LEFT_PANE_TRAY];

type LeftPaneState = {
  open: boolean;
  active: LeftPaneTrayId;
  activeTool: string;
};

const INITIAL_STATE: LeftPaneState = {
  open: true,
  active: LEFT_PANE_TRAY.NONE,
  activeTool: "",
};

export default (
  state: LeftPaneState = INITIAL_STATE,
  action: Action,
): LeftPaneState => {
  switch (action.type) {
    case "TOGGLE_LEFT_PANE":
      return {
        ...state,
        open: !state.open,
      };
    case "OPEN_LEFT_PANE":
      return {
        ...state,
        open: true,
      };
    case "CLOSE_LEFT_PANE":
      return {
        ...state,
        open: false,
        active: LEFT_PANE_TRAY.NONE,
      };
    case "SET_ACTIVE":
      return {
        ...state,
        active: action.payload as LeftPaneTrayId,
        activeTool:
          state.active === LEFT_PANE_TRAY.DRAWING_TOOLS ? state.activeTool : "",
      };
    case "SET_ACTIVE_TOOL":
      return {
        ...state,
        activeTool: action.payload as string,
      };
    case "DESELECT_TOOLS":
      return {
        ...state,
        activeTool: "",
      };
    case "TOGGLE_TOOL":
      return {
        ...state,
        activeTool:
          action.payload === state.activeTool ? "" : (action.payload as string),
      };
    case "ADD_POLYGON":
    case "SET_MARKER":
    case "CLOSE_TRAY":
      return {
        ...state,
        active: LEFT_PANE_TRAY.NONE,
        activeTool: "",
      };
    case "CLOSE_OWNERSHIP_SEARCH":
      return {
        ...state,
        active:
          state.active === LEFT_PANE_TRAY.OWNERSHIP_SEARCH
            ? LEFT_PANE_TRAY.NONE
            : state.active,
      };
    case "LOAD_MAP":
    case "NEW_MAP":
      return INITIAL_STATE;
    default:
      return state;
  }
};
