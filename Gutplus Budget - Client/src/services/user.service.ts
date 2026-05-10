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
      console.log(error.response);
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
