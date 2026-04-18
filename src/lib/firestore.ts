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
  deleteDoc,
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

export const getWeeklyData = async (
  userId: string,
  weekStartDate: string
): Promise<{
  weight: { date: string; weight: number }[];
  measurements: { date: string; waist: number; hip: number; thigh: number; upperArm: number }[];
  food: FoodRecord[];
  exercise: ExerciseRecord[];
}> => {
  const startDate = new Date(weekStartDate);
  const weightData: { date: string; weight: number }[] = [];
  const measurementData: { date: string; waist: number; hip: number; thigh: number; upperArm: number }[] = [];
  const foodData: FoodRecord[] = [];
  const exerciseData: ExerciseRecord[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const weightRef = collection(db, "records", userId, "daily", dateStr, "weight");
    const weightQ = query(weightRef, orderBy("createdAt", "asc"));
    const weightSnap = await getDocs(weightQ);
    if (!weightSnap.empty) {
      const dayRecords = weightSnap.docs.map((doc) => doc.data());
      const morningRecord = dayRecords.find((r) => r.isMorning);
      if (morningRecord) {
        weightData.push({ date: dateStr, weight: morningRecord.weight as number });
      } else {
        weightData.push({ date: dateStr, weight: dayRecords[dayRecords.length - 1].weight as number });
      }
    }

    const measurementRef = collection(db, "records", userId, "daily", dateStr, "measurement");
    const measurementQ = query(measurementRef, orderBy("createdAt", "desc"));
    const measurementSnap = await getDocs(measurementQ);
    if (!measurementSnap.empty) {
      const data = measurementSnap.docs[0].data();
      measurementData.push({
        date: dateStr,
        waist: data.waist as number,
        hip: data.hip as number,
        thigh: data.thigh as number,
        upperArm: data.upperArm as number,
      });
    }

    const foodRef = collection(db, "records", userId, "daily", dateStr, "food");
    const foodQ = query(foodRef, orderBy("createdAt", "desc"));
    const foodSnap = await getDocs(foodQ);
    foodSnap.docs.forEach((doc) => {
      const data = doc.data();
      foodData.push({
        id: doc.id,
        mealType: data.mealType as string,
        foodDescription: data.foodDescription as string,
        portion: data.portion as number,
        hungerLevel: data.hungerLevel as number,
        triggerReason: data.triggerReason as string,
        emotion: data.emotion as string,
        feeling: data.feeling as string,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    const exerciseRef = collection(db, "records", userId, "daily", dateStr, "exercise");
    const exerciseQ = query(exerciseRef, orderBy("createdAt", "desc"));
    const exerciseSnap = await getDocs(exerciseQ);
    exerciseSnap.docs.forEach((doc) => {
      const data = doc.data();
      exerciseData.push({
        id: doc.id,
        exerciseType: data.exerciseType as string,
        duration: data.duration as number,
        calories: data.calories as number,
        intensity: data.intensity as "light" | "medium" | "high",
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
  }

  return {
    weight: weightData,
    measurements: measurementData,
    food: foodData,
    exercise: exerciseData,
  };
};

export interface Plan {
  id: string;
  userId: string;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  triggerWarnings: { reason: string; count: number; recommendations: string[] }[];
  emotionPlans: { emotion: string; plan: string }[];
  mealSchedule: { day: string; meals: { time: string; type: string; suggestion: string; alternative: string }[] }[];
  avoidFoods: string[];
  createdAt: Date;
}

export const savePlan = async (
  userId: string,
  data: Omit<Plan, "id" | "createdAt">
) => {
  const planRef = collection(db, "plans", userId, "weekly");
  await addDoc(planRef, {
    ...data,
    createdAt: Timestamp.fromDate(new Date()),
  });
};

export const getPlans = async (
  userId: string
): Promise<Plan[]> => {
  const planRef = collection(db, "plans", userId, "weekly");
  const q = query(planRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId as string,
      weekId: data.weekId as string,
      weekStart: data.weekStart as string,
      weekEnd: data.weekEnd as string,
      triggerWarnings: data.triggerWarnings as Plan["triggerWarnings"],
      emotionPlans: data.emotionPlans as Plan["emotionPlans"],
      mealSchedule: data.mealSchedule as Plan["mealSchedule"],
      avoidFoods: data.avoidFoods as string[],
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
};

export const updatePlan = async (
  userId: string,
  planId: string,
  data: Partial<Omit<Plan, "id" | "userId" | "createdAt">>
) => {
  const planRef = doc(db, "plans", userId, "weekly", planId);
  await setDoc(planRef, data, { merge: true });
};

export const deletePlan = async (
  userId: string,
  planId: string
) => {
  const planRef = doc(db, "plans", userId, "weekly", planId);
  await deleteDoc(planRef);
};

export interface Ingredient {
  id: string;
  name: string;
  category: "肉类" | "主食" | "蔬菜" | "水果" | "蛋奶" | "调味品" | "其他";
  quantity: number;
  unit: string;
  remainingDays: number;
  userId: string;
  createdAt: Date;
}

export const addIngredient = async (
  userId: string,
  data: Omit<Ingredient, "id" | "userId" | "createdAt">
) => {
  const ingredientRef = collection(db, "ingredients", userId, "items");
  await addDoc(ingredientRef, {
    ...data,
    userId,
    createdAt: Timestamp.fromDate(new Date()),
  });
};

export const getIngredients = async (
  userId: string
): Promise<Ingredient[]> => {
  const ingredientRef = collection(db, "ingredients", userId, "items");
  const q = query(ingredientRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name as string,
      category: data.category as Ingredient["category"],
      quantity: data.quantity as number,
      unit: data.unit as string,
      remainingDays: data.remainingDays as number,
      userId: data.userId as string,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
};

export const updateIngredient = async (
  userId: string,
  ingredientId: string,
  data: Partial<Omit<Ingredient, "id" | "userId" | "createdAt">>
) => {
  const ingredientRef = doc(db, "ingredients", userId, "items", ingredientId);
  await setDoc(ingredientRef, data, { merge: true });
};

export const deleteIngredient = async (
  userId: string,
  ingredientId: string
) => {
  const ingredientRef = doc(db, "ingredients", userId, "items", ingredientId);
  await deleteDoc(ingredientRef);
};