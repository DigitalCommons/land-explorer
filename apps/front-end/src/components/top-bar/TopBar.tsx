import { useState } from "react";
import { Link } from "react-router-dom";
import StaticSiteMenu from "./StaticSiteMenu";
import ProfileMenu from "./ProfileMenu";
import MapTitleBar from "./MapTitleBar";
import MapMenu from "./MapMenu";
import ProfilePic from "./ProfilePic";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import SearchBar from "./SearchBar/SearchBar";
import iconHamburger from "../../assets/img/icon-hamburger.svg";
import constants from "@/constants";
import { UserButton } from "@/components/auth/user/user-button";
import { useMediaQuery } from "usehooks-ts";

type Props = {
  limited?: boolean;
};

//TODO: This will be removed when VITE_FEATURE_USE_BETTERAUTH is removed
const LegacyTopBar = ({ limited }: Props) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const [searchExpanded, setSearchExpanded] = useState(false);

  return !limited && user.populated ? (
    <div>
      <div className="topbar-shadow"></div>
      <div className="topbar">
        <Link to="/app">
          <div className="logo" />
        </Link>
        <div className="topbar-middle">
          <div className="topbar-map-interactions">
            <MapMenu />
            <MapTitleBar expanded={!searchExpanded} />
          </div>
          <SearchBar
            expanded={searchExpanded}
            setExpanded={setSearchExpanded}
          />
        </div>
        <div className="topbar-right">
          <div className="topbar-username">{`${user.firstName} ${user.lastName}`}</div>
          <ProfilePic initials={user.initials} />
          <div
            className="hamburger hamburger-logged-in"
            id="hamburger"
            onClick={() => dispatch({ type: "TOGGLE_MENU_MAIN" })}
          ></div>
        </div>
      </div>
      <StaticSiteMenu />
      <ProfileMenu />
    </div>
  ) : (
    <div>
      <div className="topbar-shadow"></div>
      <div className="topbar">
        <Link to="/app">
          <div className="logo" />
        </Link>
        <div className="topbar-right">
          <div
            className="hamburger"
            id="hamburger"
            onClick={() => dispatch({ type: "TOGGLE_MENU_MAIN" })}
          >
            <img src={iconHamburger} alt="" />
          </div>
        </div>
      </div>
      <StaticSiteMenu />
    </div>
  );
};

const TopBarNew = ({ limited }: Props) => {
  const user = useAppSelector((state) => state.user);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const matches = useMediaQuery("(min-width: 1200px)");

  if (!limited && user.populated) {
    return (
      <div className="flex gap-10 items-center py-2 bg-background z-[100003] shadow-lg">
        <Link className="ml-6" to="/app">
          <img className="lg:hidden size-10" src="./logo-green.svg" />
          <img className="hidden lg:block h-10" src="./logo-green-text.svg" />
        </Link>
        <div className="flex justify-center grow gap-5">
          <div className="flex items-center">
            <MapMenu />
            <MapTitleBar expanded={!searchExpanded} />
          </div>
          <SearchBar
            expanded={searchExpanded}
            setExpanded={setSearchExpanded}
          />
        </div>
        <div className="px-5 flex">
          <UserButton
            className="max-w-60"
            size={matches ? "default" : "icon"}
            sideOffset={12}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-10 items-center py-2 bg-background z-[100003] shadow-lg">
      <Link className="ml-6" to="/app">
        <img className="lg:hidden size-10" src="./logo-green.svg" />
        <img className="hidden lg:block h-10" src="./logo-green-text.svg" />
      </Link>
    </div>
  );
};

const TopBar = constants.VITE_FEATURE_USE_BETTERAUTH ? TopBarNew : LegacyTopBar;

export default TopBar;
