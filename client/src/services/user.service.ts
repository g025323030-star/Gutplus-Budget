import axios from "axios";

interface EmailCheckResponse {
  message: string;
}

export const checkEmail = async (email: string): Promise<EmailCheckResponse> => {
  console.log(import.meta.env.VITE_SERVER_URL);
  try {
    const resEmailChk = await axios.get(
      import.meta.env.VITE_SERVER_URL + "users/check-email",
      {
        params: {
          email: email,
        },
      }
    );
    return resEmailChk.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        if (
          error.response?.data?.message ===
          "Account expired. Please contact support."
        ) {
          return { message: "Account expired. Please contact support." };
        }
        return { message: "unauthorized user." };
      }
    }
    console.error("Error checking email:", error);
    throw error;
  }
};

export const signUp = async (email: string, password: string): Promise<string> => {
  try {
    await axios.post(import.meta.env.VITE_SERVER_URL + "users/sign-up", {
      email,
      password,
    });
   
    return 'success';
    
  } catch (error) {
    console.error("Error during sign-up:", error);
    throw error;
  }
};

export const forgotPassword = async (email: string): Promise<string> => {
  try {
    await axios.post(import.meta.env.VITE_SERVER_URL + "users/forgot-password", {
      email,
    });
   
    return 'success';
    
  } catch (error) {
    console.error("Error during forgot password:", error);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
  try {
    await axios.post(import.meta.env.VITE_SERVER_URL + "tokens/reset-password", {
      token,
      newPassword,
    });

    return 'success';

  } catch (error) {
    console.error("Error during password reset:", error);
    throw error;
  }
};

export const login = async (email: string, password: string): Promise<string> => {
  try {
    await axios.post(import.meta.env.VITE_SERVER_URL + "users/login", {
      email,
      password,
    });
    return 'success';
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

export const completeOnboarding = async (): Promise<string> => {
  try {
    await axios.patch(
      import.meta.env.VITE_SERVER_URL + "users/complete-onboarding",
    );
    return 'success';
  } catch (error) {
    console.error("Error completing onboarding:", error);
    throw error;
  }
};
