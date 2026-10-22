import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import {
  Dialog,
  DialogContent,
  DialogFooter,  
} from "../../ui/dialog";
import { closeModal } from "@/actions/ModalActions";
import { Button } from "../../ui/button";
import { ChevronLeft, ShieldLock, User } from "lucide-react";
import { UserView } from "../../auth/user/user-view";
import { Menu, MenuContent, MenuHeader, MenuItem } from "../../common/Menu";
import { ComponentType, useState } from "react";
import { cn } from "@/lib/utils";
import { ChangeEmailOtp } from "../../auth/email-otp/change-email-otp";
import { PrivacyPanel } from "./PrivacyPanel";

type UserAccountSection = "details" | "email" | "password" | "privacy";

const DetailsPanel = () => {
  return <div>Details</div>;
};

const EmailPanel = () => {
  return (
    <div className="w-full">
      <ChangeEmailOtp />
    </div>
  );
};

const PasswordPanel = () => {
  return <div>Password</div>;
};

const panels: Record<UserAccountSection, ComponentType> = {
  details: DetailsPanel,
  email: EmailPanel,
  password: PasswordPanel,
  privacy: PrivacyPanel,
};

export default function UserAccountPage() {
  const dispatch = useAppDispatch();
  const { open } = useAppSelector(
    (state) => state.modal["userAccountSettings"],
  );
  const [section, setSection] = useState<UserAccountSection>("details");
  // On small screens only one of the menu or the panel is shown at a time
  const [showPanel, setShowPanel] = useState(false);
  const Panel = panels[section];
  const selectSection = (newSection: UserAccountSection) => {
    setSection(newSection);
    setShowPanel(true);
  };
  return (
    <Dialog open={open} onOpenChange={() => void 0}>
      <DialogContent
        className="overflow-hidden w-4xl h-[min(40rem,calc(100dvh-2rem))] sm:max-w-[calc(100%-2rem)] grid-rows-[minmax(0,1fr)_auto]"
        showCloseButton={false}
      >
        <div className="flex min-h-0">
          <Menu
            className={cn(
              "overflow-y-auto max-sm:grow max-sm:-mr-4 min-w-60 max-w-60",
              showPanel && "max-sm:hidden",
            )}
          >
            <UserView className="pb-6" />
            <MenuHeader>
              <User className="size-4" />
              Account
            </MenuHeader>
            <MenuContent>
              <MenuItem
                onClick={() => selectSection("details")}
                active={section === "details"}
              >
                Details
              </MenuItem>
              <MenuItem
                onClick={() => selectSection("email")}
                active={section === "email"}
              >
                Email
              </MenuItem>
              <MenuItem
                onClick={() => selectSection("password")}
                active={section === "password"}
              >
                Password
              </MenuItem>
            </MenuContent>
            <MenuHeader>
              <ShieldLock className="size-4" />
              Privacy
            </MenuHeader>
            <MenuItem
              onClick={() => selectSection("privacy")}
              active={section === "privacy"}
            >
              Privacy Settings
            </MenuItem>
          </Menu>
          <div
            className={cn(
              "grow min-w-0 overflow-y-auto p-4 -my-4 -mr-4 max-sm:-ml-4",
              !showPanel && "max-sm:hidden",
            )}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="sm:hidden"
                aria-label="Back"
                onClick={() => setShowPanel(false)}
              >
                <ChevronLeft />
              </Button>
            </div>

            <Panel />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => dispatch(closeModal("userAccountSettings"))}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
