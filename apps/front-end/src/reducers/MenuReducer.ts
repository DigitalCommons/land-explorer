import { Action } from "../types";

type MenuState = {
  key: boolean;
  councilKey: boolean;  
  layers?: boolean;
};

const INITIAL_STATE: MenuState = {  
  key: false,
  councilKey: false,  
};

type MenuAction = Action;

export default (state: MenuState = INITIAL_STATE, action: MenuAction): MenuState => {
    switch (action.type) {
      case "TOGGLE_MENU_COUNCILKEY":
        return {
          ...state,
          councilKey: !state.councilKey,
          layers: false,
        };
      case "OPEN_MENU_COUNCILKEY":
        return {
          ...state,
          councilKey: true,
          layers: false,
        };
      case "CLOSE_MENU_COUNCILKEY":
        return {
          ...state,
          councilKey: false,
          layers: false,
        };
      case "CLOSE_MENUS":
        return {
          ...state,
          layers: false,
          key: false,
        };
      case "OPEN_MODAL":
      case "LOAD_MAP":
      case "NEW_MAP":
        return INITIAL_STATE;
      default:
        return state;
    }
}
