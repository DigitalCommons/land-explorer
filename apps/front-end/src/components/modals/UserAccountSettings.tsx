import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import {
  Dialog,
  DialogContent,
  DialogFooter,  
  DialogTitle,
} from "../ui/dialog";
import { closeModal } from "@/actions/ModalActions";
import { Button } from "../ui/button";
import { ShieldLock, User } from "lucide-react";
import { UserView } from "../auth/user/user-view";
import { Menu, MenuContent, MenuHeader, MenuItem } from "../common/Menu";
import { ComponentType, useState } from "react";
import { ChangeEmail } from "../auth/settings/account/change-email";


type UserAccountSection = "details" | "email" | "password" | "privacy";

const DetailsPanel = () => {
  return (<div>Details</div>)
}

const EmailPanel = () => {
  return ( <div>Change Email</div>)
}

const PasswordPanel = () => {
  return (<div>Password</div>)
}

const PrivacyPanel = () => {
  return (<div>Privacy</div>)
}


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
  const Panel = panels[section];
  return (
    <Dialog           
      open={open}
      onOpenChange={() => void 0}
    >
      <DialogContent className="overflow-hidden max-w-2xl! w-2xl!" showCloseButton={false}>        
          <div className="flex">
            <Menu>              
              <UserView className="pb-6"/>              
              <MenuHeader>
                <User className="size-4" />
                Account
              </MenuHeader>
              <MenuContent>
                <MenuItem onClick={() => {setSection("details")}} active={section==="details"}>Details</MenuItem>
                <MenuItem onClick={() => {setSection("email")}} active={section==="email"}>Email</MenuItem>
                <MenuItem onClick={() => {setSection("password")}} active={section==="password"}>Password</MenuItem>
              </MenuContent>
              <MenuHeader>
                <ShieldLock className="size-4" />
                Privacy
              </MenuHeader>
              <MenuItem onClick={() => {setSection("privacy")}} active={section==="privacy"}>Privacy Settings</MenuItem>              
          </Menu>
            <div className="grow p-4 -my-4 -mr-4">
              <DialogTitle>My Account</DialogTitle>
              <Panel/>
            </div>
          </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => dispatch(closeModal("userAccountSettings"))}>
            Close
          </Button>          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

