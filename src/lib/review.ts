export interface FoodReviewRecord {
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

export interface WeeklyReviewData {
  weight: { date: string; weight: number }[];
  measurements: { date: string; waist: number; hip: number; thigh: number; upperArm: number }[];
  food: FoodReviewRecord[];
  exercise: {
    id: string;
    exerciseType: string;
    duration?: number;
    amount: number;
    unit: string;
    customUnit?: string;
    calories: number;
    intensity: string;
    createdAt: Date;
  }[];
}

export interface DailyReview {
  executionRate: number;
  triggerCount: number;
  goodThings: string[];
  improvements: string[];
}

export interface WeeklyReview {
  weightChange: number;
  avgWeight: number;
  waistChange: number;
  hipChange: number;
  executionPercent: number;
  triggerCount: number;
  emotionCorrelation: { emotion: string; avgHunger: number; count: number }[];
  triggerRanking: { reason: string; count: number }[];
  goodThings: string[];
  strategies: string[];
}

const triggerLabels: Record<string, string> = {
  physiological: "生理饥饿",
  craving: "口欲",
  social: "社交",
  stress: "压力",
  boredom: "无聊",
  habit: "习惯",
  timeConflict: "时间冲突",
};

const emotionLabels: Record<string, string> = {
  calm: "平静",
  anxious: "焦虑",
  stressed: "压力",
  happy: "开心",
  sad: "悲伤",
  angry: "愤怒",
  bored: "无聊",
};

const triggerReasonsList = ["craving", "stress", "boredom", "habit", "social", "timeConflict"];

export const getTriggerLabel = (value: string) => {
  return triggerLabels[value] || value;
};

export const getEmotionLabel = (value: string) => {
  return emotionLabels[value] || value;
};

export const getWeekStartDate = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
};

export const generateDailyReview = (records: FoodReviewRecord[]): DailyReview => {
  const mainMeals = ["breakfast", "lunch", "dinner"];
  const completedMainMeals = mainMeals.filter((type) =>
    records.some((record) => record.mealType === type)
  );
  const executionRate = Math.round((completedMainMeals.length / 3) * 100);

  const triggeredSnacks = records.filter((record) =>
    triggerReasonsList.includes(record.triggerReason)
  );
  const triggerCount = triggeredSnacks.length;

  const goodThings: string[] = [];
  if (executionRate >= 66) goodThings.push("三餐规律");
  if (records.every((record) => record.hungerLevel <= 3)) goodThings.push("饥饿控制良好");
  if (records.some((record) => record.feeling?.includes("满足") || record.feeling?.includes("饱"))) {
    goodThings.push("进食满足感不错");
  }

  const improvements: string[] = [];
  if (triggerCount > 2) improvements.push("减少非饥饿原因的加餐");
  if (records.some((record) => record.hungerLevel >= 4)) improvements.push("注意餐前饥饿感");
  if (records.length < 3) improvements.push("确保每日三餐完整");

  return {
    executionRate,
    triggerCount,
    goodThings: goodThings.length > 0 ? goodThings : ["保持良好饮食习惯"],
    improvements: improvements.length > 0 ? improvements : ["继续坚持当前饮食计划"],
  };
};

export const generateWeeklyReview = (weeklyData: WeeklyReviewData): WeeklyReview => {
  const weightChanges = weeklyData.weight;
  let weightChange = 0;
  if (weightChanges.length >= 2) {
    const firstWeight = weightChanges[0].weight;
    const lastWeight = weightChanges[weightChanges.length - 1].weight;
    weightChange = lastWeight - firstWeight;
  }

  const avgWeight = weightChanges.length > 0
    ? weightChanges.reduce((sum, weight) => sum + weight.weight, 0) / weightChanges.length
    : 0;

  const measurementChanges = weeklyData.measurements;
  let waistChange = 0;
  let hipChange = 0;
  if (measurementChanges.length >= 2) {
    waistChange = measurementChanges[measurementChanges.length - 1].waist - measurementChanges[0].waist;
    hipChange = measurementChanges[measurementChanges.length - 1].hip - measurementChanges[0].hip;
  }

  const foodData = weeklyData.food;
  const mainMeals = ["breakfast", "lunch", "dinner"];
  const daysWithMainMeals = new Set<string>();
  const completedMealsPerDay: Record<string, number> = {};

  foodData.forEach((record) => {
    const date = new Date(record.createdAt).toISOString().split("T")[0];
    daysWithMainMeals.add(date);
    if (mainMeals.includes(record.mealType)) {
      completedMealsPerDay[date] = (completedMealsPerDay[date] || 0) + 1;
    }
  });

  const executionRate = Object.values(completedMealsPerDay).filter((value) => value >= 3).length;
  const totalDays = daysWithMainMeals.size || 1;
  const executionPercent = Math.round((executionRate / totalDays) * 100);

  const snackTypes = ["morningSnack", "afternoonSnack", "eveningSnack"];
  const snackRecords = foodData.filter((record) => snackTypes.includes(record.mealType));
  const triggeredSnacks = snackRecords.filter((record) => triggerReasonsList.includes(record.triggerReason));
  const triggerCount = triggeredSnacks.length;

  const emotionFoodMap: Record<string, number[]> = {};
  foodData.forEach((record) => {
    if (record.emotion && record.emotion !== "unknown") {
      emotionFoodMap[record.emotion] = emotionFoodMap[record.emotion] || [];
      emotionFoodMap[record.emotion].push(record.hungerLevel);
    }
  });

  const emotionCorrelation = Object.entries(emotionFoodMap)
    .map(([emotion, hungerLevels]) => ({
      emotion,
      avgHunger: hungerLevels.reduce((a, b) => a + b, 0) / hungerLevels.length,
      count: hungerLevels.length,
    }))
    .sort((a, b) => b.avgHunger - a.avgHunger);

  const triggerFoodMap: Record<string, number> = {};
  snackRecords.forEach((record) => {
    if (record.triggerReason && record.triggerReason !== "unknown") {
      triggerFoodMap[record.triggerReason] = (triggerFoodMap[record.triggerReason] || 0) + 1;
    }
  });

  const triggerRanking = Object.entries(triggerFoodMap)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const goodThings: string[] = [];
  if (weightChange < 0) goodThings.push("体重有所下降");
  if (executionPercent >= 60) goodThings.push("三餐规律性改善");
  if (triggerCount <= 3) goodThings.push("触发性进食控制良好");

  const strategies: string[] = [];
  if (triggerCount > 3) {
    strategies.push("识别高风险时段，提前准备健康零食");
  }
  if (emotionCorrelation.length > 0) {
    strategies.push(`注意${getEmotionLabel(emotionCorrelation[0].emotion)}情绪时的饮食冲动`);
  }
  if (triggerRanking.length > 0) {
    const topTrigger = triggerRanking[0];
    if (topTrigger.count > 2) {
      strategies.push(`避免${getTriggerLabel(topTrigger.reason)}场景`);
    }
  }
  if (strategies.length < 3) {
    strategies.push("继续记录饮食数据");
    strategies.push("保持当前良好的饮食习惯");
  }

  return {
    weightChange,
    avgWeight,
    waistChange,
    hipChange,
    executionPercent,
    triggerCount,
    emotionCorrelation: emotionCorrelation.slice(0, 3),
    triggerRanking: triggerRanking.slice(0, 3),
    goodThings: goodThings.length > 0 ? goodThings : ["保持良好饮食习惯"],
    strategies: strategies.slice(0, 3),
  };
};
