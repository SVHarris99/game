import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "./config";

export async function signInAnon(): Promise<User> {
  const result = await signInAnonymously(getFirebaseAuth());
  return result.user;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
