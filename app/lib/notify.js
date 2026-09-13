// lib/notify.js
import { toast } from "react-hot-toast";
import { playSound } from "./sounds";

export const notify = {
  success: (msg) => {
    console.log("Toast Triggered: Success -", msg); // Check your browser console!
    playSound("success");
    toast.success(msg, {
      id: msg, // Prevents duplicate ghosts
    });
  },
  error: (msg) => {
    console.log("Toast Triggered: Error -", msg);
    playSound("error");
    toast.error(msg, {
      id: msg,
    });
  },
};
