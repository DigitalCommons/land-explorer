import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import TopBar from "../../components/top-bar/TopBar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import RegisterForm from "./RegisterForm/RegisterForm";

type Props = { updateBgImage: (n: number) => void };

const Register = ({ updateBgImage }: Props) => {
  const [registering, setRegistering] = useState(false);
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
      <div
        style={{
          display: registering ? "block" : "none",
          left: "50%",
          top: "50%",
          transform: "translateX(-50%) translateY(-50%)",
          position: "absolute",
          textAlign: "center",
        }}
      >
        <Spinner />
      </div>
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
      <div
        style={{
          marginBottom: "200px",
          display: registering ? "none" : "block",
        }}
      >
        <RegisterForm
          setRegistering={setRegistering}
          setRegisterSuccess={setRegisterSuccess}
        />
      </div>
    </div>
  );
};

export default Register;
