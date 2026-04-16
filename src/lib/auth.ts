import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "./firebase";

export const firebaseSignUp = async (email: string, password: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const firebaseSignIn = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const firebaseSignOut = async () => {
  await signOut(auth);
};

export const firebaseOnAuthStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};