import { useState } from "react";
import { Route, Routes } from 'react-router-dom';
import TopBar from '../components/top-bar/TopBar';
import LoginLegacy from "./LoginLegacy";
import ResetPassword from "./ResetPassword";
import FourOhFour from "./FourOhFour";
import BackgroundImage from '../components/common/BackgroundImage';
import constants from "@/constants";
import Login from "./Login";
import Register from "./Register/Register";

const Authentication = () => {
  const [image, setImage] = useState(0);

  const updateBgImage = (n: number) => {
    setImage(n);
  };

    return (
        <div className="h-screen min-h-screen flex flex-col">
            <TopBar limited={true} />
            <BackgroundImage image={image} />
            <Routes>
                {!constants.VITE_FEATURE_USE_BETTERAUTH ? <Route path="/" element={<LoginLegacy updateBgImage={updateBgImage} />} /> : <Route path="/" element={<Login/>} />  }
                <Route path="/register" element={<Register updateBgImage={updateBgImage} />} />
                {!constants.VITE_FEATURE_USE_BETTERAUTH ? <Route path="/reset-password" element={<ResetPassword updateBgImage={updateBgImage} />} /> : null }
                <Route path="/*" element={<FourOhFour />} />
            </Routes>
        </div>
    );
}

export default Authentication;
