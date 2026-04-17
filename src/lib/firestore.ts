import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  where,
  getCountFromServer,
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

export interface WeightRecord {
  id: string;
  weight: number;
  createdAt: Date;
  isMorning: boolean;
}

export const getWeightHistory = async (
  userId: string,
  days: number = 30
): Promise<{ date: string; weight: number; isMorning: boolean }[]> => {
  const records: { date: string; weight: number; isMorning: boolean }[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const recordRef = collection(db, "records", userId, "daily", dateStr, "weight");
    const q = query(recordRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const dayRecords = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          date: dateStr,
          weight: data.weight as number,
          isMorning: data.isMorning as boolean,
        };
      });

      const morningRecord = dayRecords.find((r) => r.isMorning);
      if (morningRecord) {
        records.push(morningRecord);
      } else {
        records.push(dayRecords[dayRecords.length - 1]);
      }
    }
  }

  return records.reverse();
};