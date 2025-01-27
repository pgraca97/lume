import React, { useState } from "react";
import { AuthForm } from "@/src/components/form/AuthForm";
import { useAuth } from "@/src/hooks/useAuth";
import { Toast } from "@/src/components/feedback/Toast";
import { LoginInputs } from "@/src/utils/auth";
import { mapFirebaseError } from "@/src/utils/auth";
import { useNavigationFlow } from "@/src/hooks/useNavigationFlow";
import { router, useRouter } from "expo-router";
import { useUserStore } from "@/src/stores/useUserStore";

export default function Login() {
  const { signIn, loading } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { checkAndNavigate } = useNavigationFlow();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  
  const handleSubmit = async (data: LoginInputs) => {
    try {
      console.log('[Login] Starting login process');
      await signIn(data);
      
     
      console.log('[Login] Sign in successful');
      console.log(user)
      
    } catch (err: any) {
      console.error("[Login] Error:", err);
      setToastMessage(mapFirebaseError(err.code));
      setShowToast(true);
    }
  };


  return (
    <>
      <AuthForm
        type="login"
        loading={loading}
        onSubmit={handleSubmit}
        onToggleForm={() => router.push("/(auth)/register")}
      />

      {showToast && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}