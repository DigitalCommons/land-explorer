import { SignIn } from "@/components/auth/sign-in";
import { useEffect } from "react";

type LoginProps = { updateBgImage: (n: number) => void };

export default function Login({ updateBgImage }: LoginProps) {
    useEffect(() => {
        updateBgImage(0);
    }, []);

    return (        
    <div className="relative flex grow justify-center items-center">
        <SignIn/>        
    </div>    
    )
}