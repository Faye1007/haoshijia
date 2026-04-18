"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { getIngredients, Ingredient, getUserProfile, updateUserProfile } from "@/lib/firestore";
import { ChefHat, Calendar, Clock, Leaf, AlertCircle, CheckCircle, Settings, Flame } from "lucide-react";

interface UserSettings {
  scenario: "宿舍" | "出租屋" | "家庭";
  devices: string[];
  availableTime: number;
  hungryTimes: string[];
  preferredMethods: string[];
}

interface MealPlan {
  day: string;
  date: string;
  meals: {
    type: string;
    main: string;
    side: string;
    method: string;
    tip?: string;
  }[];
}

const mealTypes = ["早餐", "午餐", "晚餐"];

const deviceMethods: Record<string, string[]> = {
  "电饭煲": ["蒸煮", "焖饭", "煮粥", "蒸菜"],
  "微波炉": ["微波加热", "蒸蛋", "烤制"],
  "空气炸锅": ["空气炸", "烤制", "煎制"],
  "电磁炉": ["炒制", "煎制", "水煮", "火锅"],
  "蒸锅": ["清蒸", "水煮", "蒸蛋"],
  "烤箱": ["烤制", "烘焙", "焗烤"],
};

const cookingMethods: Record<string, string[]> = {
  "肉类": ["清蒸", "煎制", "水煮", "空气炸锅", "炒制"],
  "主食": ["蒸煮", "电饭煲", "微波炉"],
  "蔬菜": ["清炒", "凉拌", "水煮", "微波"],
  "水果": ["直接食用", "水果沙拉"],
  "蛋奶": ["水煮", "蒸蛋", "微波", "煎制"],
  "其他": ["直接食用", "简单加工"],
};

const scenarioEquipment: Record<string, string[]> = {
  "宿舍": ["微波炉", "电饭煲"],
  "出租屋": ["电磁炉", "电饭煲", "微波炉", "空气炸锅"],
  "家庭": ["电磁炉", "电饭煲", "微波炉", "空气炸锅", "蒸锅", "烤箱"],
};

const recipeSuggestions: Record<string, { main: string; side: string }[]> = {
  "肉类": [
    { main: "鸡胸肉", side: "西兰花" },
    { main: "鱼片", side: "番茄" },
    { main: "牛肉", side: "胡萝卜" },
    { main: "猪里脊", side: "青椒" },
  ],
  "主食": [
    { main: "米饭", side: "粗粮" },
    { main: "面条", side: "蔬菜" },
    { main: "全麦面包", side: "鸡蛋" },
    { main: "燕麦", side: "牛奶" },
  ],
  "蔬菜": [
    { main: "青菜", side: "蒜蓉" },
    { main: "番茄", side: "鸡蛋" },
    { main: "黄瓜", side: "凉拌" },
    { main: "胡萝卜", side: "木耳" },
  ],
  "水果": [
    { main: "苹果", side: "" },
    { main: "香蕉", side: "" },
    { main: "橙子", side: "" },
  ],
  "蛋奶": [
    { main: "鸡蛋", side: "全麦面包" },
    { main: "牛奶", side: "燕麦" },
    { main: "酸奶", side: "水果" },
  ],
};

const hungryTimeTips: Record<string, string[]> = {
  "上午": ["早餐要吃饱", "上午10点可加水果"],
  "下午": ["午餐要丰富", "下午4点可加坚果"],
  "晚上": ["晚餐适量", "避免夜宵"],
  "睡前": ["睡前2小时不进食", "可喝牛奶"],
};

const availableTimeOptions = [
  { value: 10, label: "10分钟以内" },
  { value: 20, label: "10-20分钟" },
  { value: 30, label: "20-30分钟" },
  { value: 60, label: "30分钟以上" },
];

interface MealPlan {
  day: string;
  date: string;
  meals: {
    type: string;
    main: string;
    side: string;
    method: string;
    tip?: string;
  }[];
}

export default function RecipePage() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyPlan, setWeeklyPlan] = useState<MealPlan[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    scenario: "出租屋",
    devices: ["电磁炉", "电饭煲"],
    availableTime: 30,
    hungryTimes: ["下午", "晚上"],
    preferredMethods: ["炒制", "蒸煮"],
  });

  useEffect(() => {
    if (user) {
      loadIngredients();
      loadUserSettings();
    }
  }, [user]);

  const loadIngredients = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getIngredients(user.uid);
      setIngredients(data);
    } catch (err) {
      console.error("加载食材失败:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSettings = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.recipeSettings) {
        setSettings(profile.recipeSettings as unknown as UserSettings);
      }
    } catch (err) {
      console.error("加载设置失败:", err);
    }
  };

  const saveUserSettings = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { recipeSettings: settings } as any);
      setShowSettings(false);
    } catch (err) {
      console.error("保存设置失败:", err);
    }
  };

  const getAvailableMethods = (): string[] => {
    const methods = new Set<string>();
    settings.devices.forEach((device) => {
      const deviceMethodsList = deviceMethods[device];
      if (deviceMethodsList) {
        deviceMethodsList.forEach((m) => methods.add(m));
      }
    });
    return Array.from(methods);
  };

  const getCategoryIngredients = (category: string) => {
    return ingredients
      .filter((i) => i.category === category)
      .sort((a, b) => a.remainingDays - b.remainingDays);
  };

  const generateWeeklyPlan = () => {
    const plan: MealPlan[] = [];
    const today = new Date();
    const availableMethods = getAvailableMethods();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString("zh-CN", { weekday: "short", month: "numeric", day: "numeric" });
      const dayKey = date.toISOString().split("T")[0];

      const dayMeals = mealTypes.map((mealType) => {
        const category = getMealCategory(mealType);
        const categoryIngredients = getCategoryIngredients(category);
        
        let mainIngredient = "";
        let method = "";
        let side = "";
        let tip = "";

        if (categoryIngredients.length > 0) {
          const sortedByExpiry = [...categoryIngredients].sort((a, b) => a.remainingDays - b.remainingDays);
          const usedIngredient = sortedByExpiry[0];
          mainIngredient = usedIngredient.name;
          
          const filteredMethods = availableMethods.length > 0 
            ? availableMethods.filter((m) => cookingMethods[category]?.includes(m))
            : cookingMethods[category] || ["简单烹饪"];
          method = filteredMethods.length > 0 
            ? filteredMethods[Math.floor(Math.random() * filteredMethods.length)]
            : "简单烹饪";
          
          const suggestions = recipeSuggestions[category];
          if (suggestions && suggestions.length > 0) {
            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            side = randomSuggestion.side;
          }
        } else {
          const suggestions = recipeSuggestions[category];
          if (suggestions && suggestions.length > 0) {
            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            mainIngredient = randomSuggestion.main;
            const filteredMethods = availableMethods.length > 0 
              ? availableMethods.filter((m) => cookingMethods[category]?.includes(m))
              : cookingMethods[category] || ["简单烹饪"];
            method = filteredMethods.length > 0 
              ? filteredMethods[Math.floor(Math.random() * filteredMethods.length)]
              : "简单烹饪";
            side = randomSuggestion.side;
          } else {
            mainIngredient = "暂无食材";
            method = "-";
          }
        }

        const hour = date.getHours();
        const timeKey = hour < 10 ? "上午" : hour < 16 ? "下午" : hour < 20 ? "晚上" : "睡前";
        if (settings.hungryTimes.includes(timeKey) && hungryTimeTips[timeKey]) {
          tip = hungryTimeTips[timeKey][Math.floor(Math.random() * hungryTimeTips[timeKey].length)];
        }

        return {
          type: mealType,
          main: mainIngredient,
          side: side || "-",
          method: method,
          tip: tip || undefined,
        };
      });

      plan.push({
        day: dateStr,
        date: dayKey,
        meals: dayMeals,
      });
    }

    setWeeklyPlan(plan);
    setHasGenerated(true);
  };

  const getMealCategory = (mealType: string): string => {
    switch (mealType) {
      case "早餐":
        return "主食";
      case "午餐":
        return "肉类";
      case "晚餐":
        return "蔬菜";
      default:
        return "主食";
    }
  };

  const getUsagePlan = () => {
    const usageMap: { ingredient: string; days: string[]; priority: number }[] = [];

    ingredients.forEach((ing) => {
      const days: string[] = [];
      
      if (ing.remainingDays <= 2) {
        for (let i = 0; i < 3; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          days.push(date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }));
        }
        usageMap.push({ ingredient: ing.name, days, priority: 1 });
      } else if (ing.remainingDays <= 5) {
        for (let i = 0; i < 4; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          days.push(date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }));
        }
        usageMap.push({ ingredient: ing.name, days, priority: 2 });
      } else {
        for (let i = 0; i < 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i + 2);
          days.push(date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }));
        }
        usageMap.push({ ingredient: ing.name, days, priority: 3 });
      }
    });

    return usageMap.sort((a, b) => a.priority - b.priority);
  };

  const expiringIngredients = ingredients.filter((i) => i.remainingDays <= 2);
  const usagePlan = getUsagePlan();

  const handleDeviceChange = (device: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      devices: checked
        ? [...prev.devices, device]
        : prev.devices.filter((d) => d !== device),
    }));
  };

  const handleHungryTimeChange = (time: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      hungryTimes: checked
        ? [...prev.hungryTimes, time]
        : prev.hungryTimes.filter((t) => t !== time),
    }));
  };

  const handleMethodChange = (method: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      preferredMethods: checked
        ? [...prev.preferredMethods, method]
        : prev.preferredMethods.filter((m) => m !== method),
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">菜谱生成</h2>
          <p className="text-zinc-500">根据您的食材库存生成一周健康食谱</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          条件设置
        </Button>
      </div>

      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              条件约束设置
            </CardTitle>
            <CardDescription>
              根据您的实际情况设置，生成更贴合的菜谱
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>居住场景</Label>
                <Select
                  value={settings.scenario}
                  onValueChange={(value: "宿舍" | "出租屋" | "家庭") =>
                    setSettings((prev) => ({
                      ...prev,
                      scenario: value,
                      devices: scenarioEquipment[value],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="宿舍">宿舍</SelectItem>
                    <SelectItem value="出租屋">出租屋</SelectItem>
                    <SelectItem value="家庭">家庭</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>每餐可投入时间</Label>
                <Select
                  value={settings.availableTime.toString()}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      availableTime: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>可用设备（多选）</Label>
              <div className="flex flex-wrap gap-3">
                {Object.keys(deviceMethods).map((device) => (
                  <div key={device} className="flex items-center space-x-2">
                    <Checkbox
                      id={`device-${device}`}
                      checked={settings.devices.includes(device)}
                      onCheckedChange={(checked) =>
                        handleDeviceChange(device, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`device-${device}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {device}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>易饿时段（多选）</Label>
              <div className="flex flex-wrap gap-3">
                {["上午", "下午", "晚上", "睡前"].map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      id={`hungry-${time}`}
                      checked={settings.hungryTimes.includes(time)}
                      onCheckedChange={(checked) =>
                        handleHungryTimeChange(time, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`hungry-${time}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {time}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>偏好做法（多选）</Label>
              <div className="flex flex-wrap gap-3">
                {["炒制", "蒸煮", "煎制", "水煮", "空气炸锅", "微波"].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={`method-${method}`}
                      checked={settings.preferredMethods.includes(method)}
                      onCheckedChange={(checked) =>
                        handleMethodChange(method, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`method-${method}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {method}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveUserSettings} className="bg-green-600 hover:bg-green-700">
                保存设置
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {expiringIngredients.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              临近过期食材 ({expiringIngredients.length} 项)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expiringIngredients.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                >
                  {item.name} · 剩{item.remainingDays}天
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            当前食材库存
          </CardTitle>
          <CardDescription>
            共 {ingredients.length} 种食材可用
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-zinc-500">加载中...</div>
          ) : ingredients.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              暂无食材，请先在"食材库存"中添加食材
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ingredients.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    item.remainingDays <= 2
                      ? "border-red-200 bg-red-50"
                      : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  <div className="font-medium text-zinc-900">{item.name}</div>
                  <div className="text-sm text-zinc-500">
                    {item.quantity}{item.unit} · 剩{item.remainingDays}天
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={generateWeeklyPlan}
          disabled={isLoading || ingredients.length === 0}
          className="bg-green-600 hover:bg-green-700"
          size="lg"
        >
          <ChefHat className="h-5 w-5 mr-2" />
          生成一周菜谱
        </Button>
      </div>

      {hasGenerated && weeklyPlan.length > 0 && (
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu">一周菜单</TabsTrigger>
            <TabsTrigger value="usage">食材使用计划</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4">
            {weeklyPlan.map((dayPlan, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    {dayPlan.day}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dayPlan.meals.map((meal, mealIndex) => (
                      <div
                        key={mealIndex}
                        className="p-4 bg-zinc-50 rounded-lg border border-zinc-100"
                      >
                        <div className="font-medium text-zinc-700 mb-2">{meal.type}</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-zinc-500">主菜:</span>
                            <span className="font-medium text-zinc-900">{meal.main}</span>
                          </div>
                          {meal.side !== "-" && (
                            <div className="flex items-start gap-2">
                              <span className="text-zinc-500">配菜:</span>
                              <span className="text-zinc-700">{meal.side}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <span className="text-zinc-500">{meal.method}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>食材消耗节奏规划</CardTitle>
                <CardDescription>
                  优先使用临近过期的食材，避免浪费
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usagePlan.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    暂无食材需要规划
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usagePlan.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          item.priority === 1
                            ? "bg-red-50 border border-red-100"
                            : item.priority === 2
                            ? "bg-amber-50 border border-amber-100"
                            : "bg-zinc-50 border border-zinc-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.priority <= 2 ? (
                            <AlertCircle
                              className={`h-4 w-4 ${
                                item.priority === 1 ? "text-red-500" : "text-amber-500"
                              }`}
                            />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium text-zinc-900">{item.ingredient}</span>
                        </div>
                        <div className="text-sm text-zinc-500">
                          建议使用: {item.days.join("、")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>健康做法推荐</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(cookingMethods).map(([category, methods]) => (
                    <div key={category} className="p-3 bg-zinc-50 rounded-lg">
                      <div className="font-medium text-zinc-900 mb-2">{category}</div>
                      <div className="flex flex-wrap gap-2">
                        {methods.map((method) => (
                          <span
                            key={method}
                            className="px-2 py-1 bg-white border border-zinc-200 rounded text-sm text-zinc-600"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}