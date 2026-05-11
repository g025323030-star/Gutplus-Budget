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