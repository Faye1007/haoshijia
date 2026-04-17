import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  currentWeight?: number;
  targetWeight?: number;
  targetDate?: Date;
}

export const createUserProfile = async (userId: string, email: string) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    email,
    createdAt: Timestamp.fromDate(new Date()),
  });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      email: data.email,
      createdAt: data.createdAt?.toDate() || new Date(),
      currentWeight: data.currentWeight,
      targetWeight: data.targetWeight,
      targetDate: data.targetDate?.toDate(),
    };
  }
  return null;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, data, { merge: true });
};

export const addDailyRecord = async (
  userId: string,
  date: string,
  recordType: string,
  data: Record<string, unknown>
) => {
  const recordRef = collection(db, "records", userId, "daily", date, recordType);
  await addDoc(recordRef, {
    ...data,
    createdAt: Timestamp.fromDate(new Date()),
  });
};

export const getDailyRecords = async (
  userId: string,
  date: string,
  recordType: string
) => {
  const recordRef = collection(db, "records", userId, "daily", date, recordType);
  const q = query(recordRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};