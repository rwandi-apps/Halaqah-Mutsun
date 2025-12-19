import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const listenAuth = (callback: (uid: string | null) => void) => {
  if (!auth) return () => {};

  return onAuthStateChanged(auth, (user) => {
    callback(user ? user.uid : null);
  });
};
