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

export interface MeasurementRecord {
  id: string;
  waist: number;
  hip: number;
  thigh: number;
  upperArm: number;
  createdAt: Date;
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

export const getMeasurementHistory = async (
  userId: string,
  days: number = 30
): Promise<{ date: string; waist: number; hip: number; thigh: number; upperArm: number }[]> => {
  const records: { date: string; waist: number; hip: number; thigh: number; upperArm: number }[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const recordRef = collection(db, "records", userId, "daily", dateStr, "measurement");
    const q = query(recordRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      records.push({
        date: dateStr,
        waist: docData.waist as number,
        hip: docData.hip as number,
        thigh: docData.thigh as number,
        upperArm: docData.upperArm as number,
      });
    }
  }

  return records.reverse();
};

export interface FoodRecord {
  id: string;
  mealType: string;
  foodDescription: string;
  portion: number;
  hungerLevel: number;
  triggerReason: string;
  emotion: string;
  feeling: string;
  createdAt: Date;
}

export const getFoodHistory = async (
  userId: string,
  date: string
): Promise<FoodRecord[]> => {
  const recordRef = collection(db, "records", userId, "daily", date, "food");
  const q = query(recordRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      mealType: data.mealType as string,
      foodDescription: data.foodDescription as string,
      portion: data.portion as number,
      hungerLevel: data.hungerLevel as number,
      triggerReason: data.triggerReason as string,
      emotion: data.emotion as string,
      feeling: data.feeling as string,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
};

export interface ExerciseRecord {
  id: string;
  exerciseType: string;
  duration: number;
  calories: number;
  intensity: "light" | "medium" | "high";
  createdAt: Date;
}

export const addExerciseRecord = async (
  userId: string,
  date: string,
  data: Omit<ExerciseRecord, "id" | "createdAt">
) => {
  const recordRef = collection(db, "records", userId, "daily", date, "exercise");
  await addDoc(recordRef, {
    ...data,
    createdAt: Timestamp.fromDate(new Date()),
  });
};

export const getExerciseHistory = async (
  userId: string,
  date: string
): Promise<ExerciseRecord[]> => {
  const recordRef = collection(db, "records", userId, "daily", date, "exercise");
  const q = query(recordRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      exerciseType: data.exerciseType as string,
      duration: data.duration as number,
      calories: data.calories as number,
      intensity: data.intensity as "light" | "medium" | "high",
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
};