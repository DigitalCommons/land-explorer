import { useState } from "react";
import { Route, Routes } from 'react-router-dom';
import TopBar from '../components/top-bar/TopBar';
import Register from "./Register";
import Login from "./Login";
import ResetPassword from "./ResetPassword";
import FourOhFour from "./FourOhFour";
import BackgroundImage from '../components/common/BackgroundImage';
import constants from "@/constants";

const Authentication = () => {
    const [image, setImage] = useState(0);

    const updateBgImage = (n: number) => {
        setImage(n);
    }

    return (
        <div>
            <TopBar limited={true} />
            <BackgroundImage image={image} />
            <Routes>
                {!constants.VITE_FEATURE_USE_BETTERAUTH ? <Route path="/" element={<Login updateBgImage={updateBgImage} />} /> : null }
                <Route path="/register" element={<Register updateBgImage={updateBgImage} />} />
                {!constants.VITE_FEATURE_USE_BETTERAUTH ? <Route path="/reset-password" element={<ResetPassword updateBgImage={updateBgImage} />} /> : null }
                <Route path="/*" element={<FourOhFour />} />
            </Routes>
        </div>
    );
}

export default Authentication;
