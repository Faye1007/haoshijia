import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
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

export const firebaseReauthenticateWithPassword = async (
  user: User,
  password: string
) => {
  if (!user.email) {
    throw new Error("当前账号缺少邮箱，无法重新验证身份");
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
};

export const firebaseDeleteCurrentUser = async (user: User) => {
  await deleteUser(user);
};

export const firebaseOnAuthStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
