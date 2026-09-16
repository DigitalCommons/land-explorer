import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopBar from "../../components/top-bar/TopBar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import RegisterForm from "./RegisterForm/RegisterForm";

type Props = { updateBgImage: (n: number) => void };

const Register = ({ updateBgImage }: Props) => {
  const [registerSuccess, setRegisterSuccess] = useState(false);

  useEffect(() => {
    updateBgImage(1);
  }, []);

  return (
    <div className="box-border h-screen overflow-y-scroll pb-50">
      <TopBar limited={true} />
      <Dialog open={registerSuccess}>
        <DialogContent
          showCloseButton={false}
          className="flex flex-col items-center gap-4 text-center"
        >
          <DialogTitle>Registration Successful</DialogTitle>
          <Link to="/auth/" className="button button-small">
            Ok
          </Link>
        </DialogContent>
      </Dialog>
      <RegisterForm setRegisterSuccess={setRegisterSuccess} />
    </div>
  );
};

export default Register;
