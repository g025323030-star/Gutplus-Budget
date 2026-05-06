import React from "react";
import axios from "axios";

const checkEmail = async (email) => {
    try {
        const resEmailCHk = await axios.get(SERVER_URL + "/check-email",{
            params: {
                email: email
            }
        })
        return resEmailCHk.data;
    } catch (error) {
        console.error("Error checking email:", error);
        throw error;
    }   
        }