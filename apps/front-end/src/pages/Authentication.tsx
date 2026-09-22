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
import { SignOut } from "@/components/auth/sign-out";

const Authentication = () => {
  const [image, setImage] = useState(0);

    const updateBgImage = (n: number) => {
        setImage(n);
    }
   
    if (!constants.VITE_FEATURE_USE_BETTERAUTH) {
        return (
            <div className="h-screen min-h-screen flex flex-col">
                <TopBar limited={true} />
                <BackgroundImage image={image} />
                <Routes>
                    <Route path="/" element={<LoginLegacy updateBgImage={updateBgImage} />} />  
                    <Route path="/register" element={<Register updateBgImage={updateBgImage} />} />
                    <Route path="/reset-password" element={<ResetPassword updateBgImage={updateBgImage} />} />
                    <Route path="/*" element={<FourOhFour />} />
                </Routes>
            </div>
        )
    } else {
        return(
            <div className="h-screen min-h-screen flex flex-col">
            <TopBar limited={true} />
            <BackgroundImage image={image} />
            <Routes>
                <Route path="/" element={<Login updateBgImage={updateBgImage}/>} />
                <Route path="/register" element={<Register updateBgImage={updateBgImage} />} />
                <Route path="/sign-out" element={<SignOut />} />
                <Route path="/*" element={<FourOhFour />} />
            </Routes>
        </div>
    )}
}

export default Authentication;
