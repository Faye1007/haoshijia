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
  deleteDoc,
  writeBatch,
  deleteField,
  DocumentReference,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  nickname?: string;
  heightCm?: number;
  gender?: string;
  birthYear?: number;
  activityLevel?: string;
  currentWeight?: number;
  targetWeight?: number;
  targetDate?: Date;
  recipeSettings?: Record<string, unknown>;
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
      nickname: data.nickname || undefined,
      heightCm: data.heightCm ?? undefined,
      gender: data.gender || undefined,
      birthYear: data.birthYear ?? undefined,
      activityLevel: data.activityLevel || undefined,
      currentWeight: data.currentWeight,
      targetWeight: data.targetWeight,
      targetDate: data.targetDate?.toDate(),
      recipeSettings: data.recipeSettings,
    };
  }
  return null;
};

export const updateUserProfile = async (userId: string, data: Record<string, unknown>) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, data, { merge: true });
};

const recordTypes = ["weight", "measurement", "food", "exercise"] as const;
const clearConfirmStartDate = new Date("2024-01-01T00:00:00");

const getDateRange = (startDate?: Date | null) => {
  const dates: string[] = [];
  const start = startDate && Number.isFinite(startDate.getTime())
    ? new Date(startDate)
    : clearConfirmStartDate;
  const end = new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(cursor.toISOString().split("T")[0]);
  }

  return dates;
};

const commitDeletedRefs = async (refs: DocumentReference<DocumentData>[]) => {
  for (let index = 0; index < refs.length; index += 450) {
    const batch = writeBatch(db);
    refs.slice(index, index + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
};

const deleteCollectionDocs = async (
  collectionPath: string[]
) => {
  const [rootPath, ...pathSegments] = collectionPath;
  if (!rootPath) return;

  const snapshot = await getDocs(collection(db, rootPath, ...pathSegments));
  await commitDeletedRefs(snapshot.docs.map((recordDoc) => recordDoc.ref));
};

const deleteKnownUserSubcollections = async (
  userId: string,
  startDate?: Date | null
) => {
  const dates = getDateRange(startDate);

  for (const date of dates) {
    for (const recordType of recordTypes) {
      await deleteCollectionDocs(["records", userId, "daily", date, recordType]);
    }
  }

  await deleteCollectionDocs(["plans", userId, "weekly"]);
  await deleteCollectionDocs(["ingredients", userId, "items"]);
  await deleteCollectionDocs(["reviews", userId, "weekly"]);
};

export const clearUserHistoryData = async (
  userId: string,
  startDate?: Date | null
) => {
  await deleteKnownUserSubcollections(userId, startDate);

  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      currentWeight: deleteField(),
      targetWeight: deleteField(),
      targetDate: deleteField(),
      recipeSettings: deleteField(),
    },
    { merge: true }
  );
};

export const deleteUserData = async (
  userId: string,
  startDate?: Date | null
) => {
  await clearUserHistoryData(userId, startDate);
  await deleteDoc(doc(db, "users", userId));
  await deleteDoc(doc(db, "records", userId));
  await deleteDoc(doc(db, "plans", userId));
  await deleteDoc(doc(db, "ingredients", userId));
  await deleteDoc(doc(db, "reviews", userId));
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

export const deleteDailyRecord = async (
  userId: string,
  date: string,
  recordType: string,
  recordId: string
) => {
  const recordRef = doc(db, "records", userId, "daily", date, recordType, recordId);
  await deleteDoc(recordRef);
};

export interface WeightRecord {
  id: string;
  weight: number;
  createdAt: Date;
  isMorning: boolean;
}

export interface DisplayWeight {
  date: string;
  weight: number;
  isMorning: boolean;
  source: "today" | "latest";
}

const getDisplayWeightForDate = async (
  userId: string,
  date: string
): Promise<Omit<DisplayWeight, "source"> | null> => {
  const recordRef = collection(db, "records", userId, "daily", date, "weight");
  const q = query(recordRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const dayRecords = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      date,
      weight: data.weight as number,
      isMorning: data.isMorning as boolean,
    };
  });
  const morningRecord = dayRecords.find((record) => record.isMorning);

  return morningRecord || dayRecords[dayRecords.length - 1];
};

export const getLatestDisplayWeight = async (
  userId: string,
  today: string,
  days: number = 90
): Promise<DisplayWeight | null> => {
  const todayWeight = await getDisplayWeightForDate(userId, today);

  if (todayWeight) {
    return {
      ...todayWeight,
      source: "today",
    };
  }

  const todayDate = new Date(today);
  for (let i = 1; i < days; i++) {
    const date = new Date(todayDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const weight = await getDisplayWeightForDate(userId, dateStr);

    if (weight) {
      return {
        ...weight,
        source: "latest",
      };
    }
  }

  return null;
};

export interface MeasurementRecord {
  id: string;
  waist: number;
  hip: number;
  thigh: number;
  upperArm: number;
  createdAt: Date;
}

export interface LatestMeasurementValue {
  value: number;
  date: string;
}

export interface LatestMeasurementSummary {
  waist: LatestMeasurementValue | null;
  hip: LatestMeasurementValue | null;
  thigh: LatestMeasurementValue | null;
  upperArm: LatestMeasurementValue | null;
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

export const getLatestMeasurementSummary = async (
  userId: string,
  days: number = 90
): Promise<LatestMeasurementSummary> => {
  const summary: LatestMeasurementSummary = {
    waist: null,
    hip: null,
    thigh: null,
    upperArm: null,
  };
  const fields: (keyof LatestMeasurementSummary)[] = ["waist", "hip", "thigh", "upperArm"];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    if (fields.every((field) => summary[field])) break;

    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const recordRef = collection(db, "records", userId, "daily", dateStr, "measurement");
    const q = query(recordRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    for (const recordDoc of snapshot.docs) {
      const data = recordDoc.data();

      fields.forEach((field) => {
        if (summary[field]) return;

        const value = data[field];
        if (typeof value === "number" && value > 0) {
          summary[field] = {
            value,
            date: dateStr,
          };
        }
      });
    }
  }

  return summary;
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
  mealTime?: string;
  foodDescription: string;
  portion: number;
  hungerLevel: number;
  triggerReason: string;
  emotion: string;
  feeling: string;
  createdAt: Date;
}

const normalizeFoodRecord = (id: string, data: Record<string, unknown>): FoodRecord => ({
  id,
  mealType: data.mealType as string,
  mealTime: typeof data.mealTime === "string" ? data.mealTime : undefined,
  foodDescription: data.foodDescription as string,
  portion: data.portion as number,
  hungerLevel: data.hungerLevel as number,
  triggerReason: data.triggerReason as string,
  emotion: data.emotion as string,
  feeling: data.feeling as string,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
});

export const getFoodHistory = async (
  userId: string,
  date: string
): Promise<FoodRecord[]> => {
  const recordRef = collection(db, "records", userId, "daily", date, "food");
  const q = query(recordRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => normalizeFoodRecord(doc.id, doc.data()));
};

export interface ExerciseRecord {
  id: string;
  exerciseType: string;
  duration?: number;
  amount: number;
  unit: string;
  customUnit?: string;
  calories: number;
  intensity: "light" | "medium" | "high";
  createdAt: Date;
}

const normalizeExerciseRecord = (id: string, data: Record<string, unknown>): ExerciseRecord => {
  const amount = typeof data.amount === "number"
    ? data.amount
    : typeof data.duration === "number"
      ? data.duration
      : 0;
  const unit = typeof data.unit === "string" ? data.unit : "minutes";

  return {
    id,
    exerciseType: data.exerciseType as string,
    duration: data.duration as number | undefined,
    amount,
    unit,
    customUnit: data.customUnit as string | undefined,
    calories: typeof data.calories === "number" ? data.calories : 0,
    intensity: data.intensity as "light" | "medium" | "high",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  };
};

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

  return snapshot.docs.map((doc) => normalizeExerciseRecord(doc.id, doc.data()));
};

export interface RecordPresence {
  date: string;
  weight: boolean;
  measurement: boolean;
  food: boolean;
  exercise: boolean;
}

export const getRecordPresenceHistory = async (
  userId: string,
  days: number = 14
): Promise<RecordPresence[]> => {
  const records: RecordPresence[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const presence: RecordPresence = {
      date: dateStr,
      weight: false,
      measurement: false,
      food: false,
      exercise: false,
    };

    for (const recordType of recordTypes) {
      const recordRef = collection(db, "records", userId, "daily", dateStr, recordType);
      const snapshot = await getDocs(recordRef);
      presence[recordType] = !snapshot.empty;
    }

    records.push(presence);
  }

  return records;
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
      foodData.push(normalizeFoodRecord(doc.id, doc.data()));
    });

    const exerciseRef = collection(db, "records", userId, "daily", dateStr, "exercise");
    const exerciseQ = query(exerciseRef, orderBy("createdAt", "desc"));
    const exerciseSnap = await getDocs(exerciseQ);
    exerciseSnap.docs.forEach((doc) => {
      exerciseData.push(normalizeExerciseRecord(doc.id, doc.data()));
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
  servings?: number;
  remainingDays: number;
  userId: string;
  createdAt: Date;
}

export type IngredientInput = Omit<Ingredient, "id" | "userId" | "createdAt" | "servings"> & {
  servings?: number | null;
};

export const addIngredient = async (
  userId: string,
  data: IngredientInput
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
      servings: typeof data.servings === "number" ? data.servings : undefined,
      remainingDays: data.remainingDays as number,
      userId: data.userId as string,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
};

export const updateIngredient = async (
  userId: string,
  ingredientId: string,
  data: Partial<IngredientInput>
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
