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
import { Button } from "@/components/ui/button";
import { BookOpenIcon, HeartIcon, MapIcon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { openModal } from "@/actions/ModalActions";
import { trackEvent } from "@/analytics";
import { cn } from "@/lib/utils";

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

const DONATE_URL = "https://opencollective.com/digitalcommonscoop";

const TopBarLogo = () => (
  <Link className="shrink-0" to="/app">
    <img className="lg:hidden size-10" src="/logo-green.svg" alt="LandExplorer" />
    <img
      className="hidden lg:block h-10"
      src="/logo-green-text.svg"
      alt="LandExplorer"
    />
  </Link>
);

const TopBarNew = ({ limited }: Props) => {
  const user = useAppSelector((state) => state.user);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const isMedium = useMediaQuery("(min-width: 768px)");
  const isWide = useMediaQuery("(min-width: 1280px)");
  const dispatch = useAppDispatch();

  const userMenuLinks = [
    <DropdownMenuItem
      key="my-maps"
      onClick={() => dispatch(openModal("openMap"))}
    >
      <MapIcon className="text-muted-foreground" />
      My Maps
    </DropdownMenuItem>,
    <DropdownMenuItem
      key="user-guide"
      onClick={() => {
        trackEvent(
          "User_ViewedGuide",
          { source: "profile-menu" },
          user.analyticsConsent === true,
        );
        window.open(constants.USER_GUIDE_URL, "_blank");
      }}
    >
      <BookOpenIcon className="text-muted-foreground" />
      User Guide
    </DropdownMenuItem>,
  ];

  if (!isMedium) {
    userMenuLinks.push(
      <DropdownMenuItem key="donate" onClick={() => window.open(DONATE_URL)}>
        <HeartIcon className="fill-primary text-primary" />
        Donate
      </DropdownMenuItem>,
    );
  }

  if (!limited && user.populated) {
    return (
      <div className="relative z-[30] flex h-16 items-center gap-2 px-3 bg-background shadow-lg sm:gap-4 sm:px-6">
        <TopBarLogo />      
        <div className="flex min-w-0 grow items-center justify-center gap-2 md:gap-5">
          <div className="flex min-w-0 items-center [&_.map-title-bar]:min-w-0">
            <MapMenu />
            <MapTitleBar expanded={!searchExpanded} />
          </div>
          <div
            className={cn(
              "flex min-w-0 justify-center md:max-w-[600px] md:flex-1 md:[&_.search-bar-container]:w-full!",
              searchExpanded &&
                "flex-1 [&_.geocoder-expanded]:w-full! [&_.geocoder-expanded]:min-w-0! [&_.geocoder-expanded]:max-w-none!",
            )}
          >
            <SearchBar
              expanded={searchExpanded}
              setExpanded={setSearchExpanded}
            />
          </div>
        </div>
        
        {/* On small screens Donate lives in the user menu to leave room for search */}
        <Button
          className="hidden md:inline-flex"
          variant="secondary"
          size="lg"
          onClick={() => window.open(DONATE_URL)}
        >
          <HeartIcon className="fill-primary text-primary" data-icon="inline-start" />
          Donate
        </Button>
        <UserButton
          className="max-w-60 shrink-0"
          size={isWide ? "default" : "icon"}
          sideOffset={12}
          links={userMenuLinks}
          variant="ghost"
        />
      </div>
    );
  }

  return (
    <div className="relative z-[30] flex h-16 items-center px-3 bg-background shadow-lg sm:px-6">
      <TopBarLogo />
    </div>
  );
};

const TopBar = constants.VITE_FEATURE_USE_BETTERAUTH ? TopBarNew : LegacyTopBar;

export default TopBar;
