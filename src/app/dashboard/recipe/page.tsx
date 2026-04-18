"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getIngredients, Ingredient } from "@/lib/firestore";
import { ChefHat, Calendar, Clock, Leaf, AlertCircle, CheckCircle } from "lucide-react";

interface MealPlan {
  day: string;
  date: string;
  meals: {
    type: string;
    main: string;
    side: string;
    method: string;
  }[];
}

const mealTypes = ["早餐", "午餐", "晚餐"];

const cookingMethods: Record<string, string[]> = {
  "肉类": ["清蒸", "煎制", "水煮", "空气炸锅", "炒制"],
  "主食": ["蒸煮", "电饭煲", "微波炉"],
  "蔬菜": ["清炒", "凉拌", "水煮", "微波"],
  "水果": ["直接食用", "水果沙拉"],
  "蛋奶": ["水煮", "蒸蛋", "微波", "煎制"],
  "其他": ["直接食用", "简单加工"],
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

export default function RecipePage() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyPlan, setWeeklyPlan] = useState<MealPlan[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (user) {
      loadIngredients();
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

  const getCategoryIngredients = (category: string) => {
    return ingredients
      .filter((i) => i.category === category)
      .sort((a, b) => a.remainingDays - b.remainingDays);
  };

  const generateWeeklyPlan = () => {
    const plan: MealPlan[] = [];
    const today = new Date();

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

        if (categoryIngredients.length > 0) {
          const sortedByExpiry = [...categoryIngredients].sort((a, b) => a.remainingDays - b.remainingDays);
          const usedIngredient = sortedByExpiry[0];
          mainIngredient = usedIngredient.name;
          
          const methods = cookingMethods[category] || ["简单烹饪"];
          method = methods[Math.floor(Math.random() * methods.length)];
          
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
            const methods = cookingMethods[category] || ["简单烹饪"];
            method = methods[Math.floor(Math.random() * methods.length)];
            side = randomSuggestion.side;
          } else {
            mainIngredient = "暂无食材";
            method = "-";
          }
        }

        return {
          type: mealType,
          main: mainIngredient,
          side: side || "-",
          method: method,
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">菜谱生成</h2>
        <p className="text-zinc-500">根据您的食材库存生成一周健康食谱</p>
      </div>

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