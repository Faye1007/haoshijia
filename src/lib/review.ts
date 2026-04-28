export interface FoodReviewRecord {
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
  foodPreference: {
    foods: { name: string; count: number }[];
    methods: { name: string; count: number }[];
    note: string;
  };
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

const foodKeywords = [
  "鸡胸肉",
  "鸡肉",
  "牛肉",
  "猪肉",
  "鱼",
  "虾",
  "鸡蛋",
  "豆腐",
  "牛奶",
  "酸奶",
  "米饭",
  "糙米",
  "燕麦",
  "玉米",
  "红薯",
  "土豆",
  "面包",
  "面条",
  "意面",
  "番茄",
  "黄瓜",
  "生菜",
  "西兰花",
  "菠菜",
  "蘑菇",
  "胡萝卜",
  "白菜",
  "苹果",
  "香蕉",
  "蓝莓",
  "橙子",
  "坚果",
];

const cookingMethodKeywords: { keyword: string; label: string }[] = [
  { keyword: "空气炸", label: "空气炸" },
  { keyword: "微波", label: "微波加热" },
  { keyword: "水煮", label: "水煮" },
  { keyword: "凉拌", label: "凉拌" },
  { keyword: "清炒", label: "炒制" },
  { keyword: "炒", label: "炒制" },
  { keyword: "蒸", label: "蒸煮" },
  { keyword: "煮", label: "蒸煮" },
  { keyword: "煎", label: "煎制" },
  { keyword: "烤", label: "烤制" },
  { keyword: "炖", label: "炖煮" },
  { keyword: "焖", label: "焖煮" },
  { keyword: "卤", label: "卤制" },
  { keyword: "拌", label: "凉拌" },
];

const countEntries = (counter: Record<string, number>) => {
  return Object.entries(counter)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
};

const generateFoodPreference = (records: FoodReviewRecord[]): WeeklyReview["foodPreference"] => {
  const foodCounter: Record<string, number> = {};
  const methodCounter: Record<string, number> = {};

  records.forEach((record) => {
    const description = record.foodDescription.trim();
    if (!description) return;

    foodKeywords.forEach((keyword) => {
      if (description.includes(keyword)) {
        foodCounter[keyword] = (foodCounter[keyword] || 0) + 1;
      }
    });

    const matchedMethods = new Set<string>();
    cookingMethodKeywords.forEach(({ keyword, label }) => {
      if (description.includes(keyword)) {
        matchedMethods.add(label);
      }
    });
    matchedMethods.forEach((label) => {
      methodCounter[label] = (methodCounter[label] || 0) + 1;
    });
  });

  const foods = countEntries(foodCounter).slice(0, 5);
  const methods = countEntries(methodCounter).slice(0, 3);
  const foodText = foods.map((item) => item.name).join("、");
  const methodText = methods.map((item) => item.name).join("、");

  let note = "本周饮食记录还不够集中，暂时看不出稳定偏好。继续记录后，系统会更容易识别常吃食物和做法。";
  if (foods.length > 0 && methods.length > 0) {
    note = `本周较常出现 ${foodText}，做法偏向 ${methodText}。生成菜谱时可优先保留这些熟悉搭配，再逐步调整份量和搭配。`;
  } else if (foods.length > 0) {
    note = `本周较常出现 ${foodText}。生成菜谱时可优先围绕这些食材安排，降低执行成本。`;
  } else if (methods.length > 0) {
    note = `本周做法偏向 ${methodText}。生成菜谱时可优先选择类似做法，让计划更容易执行。`;
  }

  return {
    foods,
    methods,
    note,
  };
};

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

  const foodPreference = generateFoodPreference(foodData);

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
    foodPreference,
    goodThings: goodThings.length > 0 ? goodThings : ["保持良好饮食习惯"],
    strategies: strategies.slice(0, 3),
  };
};
