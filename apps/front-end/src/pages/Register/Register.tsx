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
    <div
      style={{
        height: "100vh",
        overflowY: "scroll",
        position: "relative",
      }}
    >
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
      <div style={{ marginBottom: "200px" }}>
        <RegisterForm setRegisterSuccess={setRegisterSuccess} />
      </div>
    </div>
  );
};

export default Register;
