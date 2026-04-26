"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import {
  addIngredient,
  deleteIngredient,
  getIngredients,
  getUserProfile,
  Ingredient,
  updateIngredient,
  updateUserProfile,
} from "@/lib/firestore";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChefHat,
  Clock,
  Edit2,
  Flame,
  Grid3X3,
  Leaf,
  Package,
  Printer,
  Settings,
  Table2,
  Trash2,
} from "lucide-react";

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

type RecipeView = "table" | "grid" | "calendar";

interface ShoppingNeed {
  category: string;
  reason: string;
  priority: "required" | "optional";
}

const categories = [
  { value: "肉类", label: "肉类", color: "bg-red-100 text-red-700" },
  { value: "主食", label: "主食", color: "bg-amber-100 text-amber-700" },
  { value: "蔬菜", label: "蔬菜", color: "bg-green-100 text-green-700" },
  { value: "水果", label: "水果", color: "bg-pink-100 text-pink-700" },
  { value: "蛋奶", label: "蛋奶", color: "bg-blue-100 text-blue-700" },
  { value: "调味品", label: "调味品", color: "bg-purple-100 text-purple-700" },
  { value: "其他", label: "其他", color: "bg-zinc-100 text-zinc-700" },
];

const units = ["克", "千克", "个", "颗", "袋", "盒", "瓶", "把", "块"];
const mealTypes = ["早餐", "午餐", "晚餐"];

const deviceMethods: Record<string, string[]> = {
  电饭煲: ["蒸煮", "焖饭", "煮粥", "蒸菜"],
  微波炉: ["微波加热", "蒸蛋", "烤制"],
  空气炸锅: ["空气炸", "烤制", "煎制"],
  电磁炉: ["炒制", "煎制", "水煮", "火锅"],
  蒸锅: ["清蒸", "水煮", "蒸蛋"],
  烤箱: ["烤制", "烘焙", "焗烤"],
};

const cookingMethods: Record<string, string[]> = {
  肉类: ["清蒸", "煎制", "水煮", "空气炸", "炒制"],
  主食: ["蒸煮", "焖饭", "煮粥", "微波加热"],
  蔬菜: ["清炒", "凉拌", "水煮", "微波加热"],
  水果: ["直接食用", "水果沙拉"],
  蛋奶: ["水煮", "蒸蛋", "微波加热", "煎制"],
  其他: ["直接食用", "简单加工"],
};

const scenarioEquipment: Record<UserSettings["scenario"], string[]> = {
  宿舍: ["微波炉", "电饭煲"],
  出租屋: ["电磁炉", "电饭煲", "微波炉", "空气炸锅"],
  家庭: ["电磁炉", "电饭煲", "微波炉", "空气炸锅", "蒸锅", "烤箱"],
};

const hungryTimeTips: Record<string, string[]> = {
  上午: ["早餐要吃饱", "上午10点可加水果"],
  下午: ["午餐要丰富", "下午4点可加坚果"],
  晚上: ["晚餐适量", "避免夜宵"],
  睡前: ["睡前2小时不进食", "可喝牛奶"],
};

const availableTimeOptions = [
  { value: 10, label: "10分钟以内" },
  { value: 20, label: "10-20分钟" },
  { value: 30, label: "20-30分钟" },
  { value: 60, label: "30分钟以上" },
];

const defaultSettings: UserSettings = {
  scenario: "出租屋",
  devices: ["电磁炉", "电饭煲"],
  availableTime: 30,
  hungryTimes: ["下午", "晚上"],
  preferredMethods: ["炒制", "蒸煮"],
};

export default function InventoryPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "inventory");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("全部");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<MealPlan[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [recipeView, setRecipeView] = useState<RecipeView>("table");
  const [recipeWarning, setRecipeWarning] = useState("");
  const [shoppingNeeds, setShoppingNeeds] = useState<ShoppingNeed[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("肉类");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<string>("克");
  const [remainingDays, setRemainingDays] = useState("");
  const [error, setError] = useState("");

  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Ingredient | null>(null);

  const loadIngredients = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getIngredients(user.uid);
      setIngredients(data);
    } catch (err) {
      console.error("加载失败:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadUserSettings = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.recipeSettings) {
        setSettings(profile.recipeSettings as unknown as UserSettings);
      }
    } catch (err) {
      console.error("加载设置失败:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadIngredients();
    loadUserSettings();
  }, [loadIngredients, loadUserSettings, user]);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "inventory");
  }, [searchParams]);

  const resetIngredientForm = () => {
    setName("");
    setCategory("肉类");
    setQuantity("");
    setUnit("克");
    setRemainingDays("");
    setError("");
  };

  const validateIngredientForm = () => {
    if (!name.trim()) {
      setError("请输入食材名称");
      return null;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("请输入有效的数量");
      return null;
    }

    const days = parseInt(remainingDays);
    if (isNaN(days) || days < 0) {
      setError("请输入有效的剩余天数");
      return null;
    }

    return {
      name: name.trim(),
      category: category as Ingredient["category"],
      quantity: qty,
      unit,
      remainingDays: days,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = validateIngredientForm();
    if (!payload) return;

    setIsSaving(true);
    setError("");

    try {
      await addIngredient(user.uid, payload);
      resetIngredientForm();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadIngredients();
    } catch (err) {
      console.error("保存失败:", err);
      setError("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: Ingredient) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setRemainingDays(item.remainingDays.toString());
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!user || !editingItem) return;

    const payload = validateIngredientForm();
    if (!payload) return;

    try {
      await updateIngredient(user.uid, editingItem.id, payload);
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetIngredientForm();
      await loadIngredients();
    } catch (err) {
      console.error("更新失败:", err);
      setError("更新失败，请重试");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user || !itemToDelete) return;
    try {
      await deleteIngredient(user.uid, itemToDelete.id);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      await loadIngredients();
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  const saveUserSettings = async () => {
    if (!user) return;
    try {
      const recipeSettings: Record<string, unknown> = { ...settings };
      await updateUserProfile(user.uid, { recipeSettings });
      setActiveTab("recipe");
    } catch (err) {
      console.error("保存设置失败:", err);
    }
  };

  const getCategoryColor = (cat: string) => {
    return categories.find((c) => c.value === cat)?.color || "bg-zinc-100 text-zinc-700";
  };

  const getAvailableMethods = (): string[] => {
    const methods = new Set<string>();
    settings.devices.forEach((device) => {
      deviceMethods[device]?.forEach((method) => methods.add(method));
    });
    return Array.from(methods);
  };

  const getCategoryIngredients = (ingredientCategory: string) => {
    return ingredients
      .filter((item) => item.category === ingredientCategory)
      .sort((a, b) => a.remainingDays - b.remainingDays);
  };

  const generateWeeklyPlan = () => {
    const staples = getCategoryIngredients("主食");
    const vegetables = getCategoryIngredients("蔬菜");
    const fruits = getCategoryIngredients("水果");
    const proteins = ingredients
      .filter((item) => item.category === "肉类" || item.category === "蛋奶")
      .sort((a, b) => a.remainingDays - b.remainingDays);
    const requiredNeeds: ShoppingNeed[] = [];
    const optionalNeeds: ShoppingNeed[] = [];

    if (staples.length === 0) {
      requiredNeeds.push({
        category: "主食不足",
        reason: "早餐和午餐需要至少 1 种主食",
        priority: "required",
      });
    }

    if (proteins.length === 0) {
      requiredNeeds.push({
        category: "蛋白质不足",
        reason: "早餐、午餐和晚餐需要肉类或蛋奶作为蛋白质来源",
        priority: "required",
      });
    }

    if (vegetables.length < 2) {
      requiredNeeds.push({
        category: "蔬菜不足",
        reason: "午餐需要 2 份蔬菜，晚餐也需要蔬菜搭配",
        priority: "required",
      });
    }

    if (fruits.length === 0) {
      optionalNeeds.push({
        category: "水果可选补充",
        reason: "早餐可搭配水果，但不影响生成完整一周菜谱",
        priority: "optional",
      });
    }

    if (requiredNeeds.length > 0) {
      setRecipeWarning("当前库存不足以生成完整一周菜谱");
      setShoppingNeeds([...requiredNeeds, ...optionalNeeds]);
      setWeeklyPlan([]);
      setHasGenerated(false);
      return;
    }

    const plan: MealPlan[] = [];
    const today = new Date();
    const availableMethods = getAvailableMethods();
    const pickIngredient = (items: Ingredient[], index: number) => items[index % items.length];
    const getMethod = (category: Ingredient["category"]) => {
      const filteredMethods = availableMethods.filter((method) =>
        cookingMethods[category]?.includes(method)
      );
      return filteredMethods[0] || cookingMethods[category]?.[0] || "简单烹饪";
    };

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString("zh-CN", { weekday: "short", month: "numeric", day: "numeric" });
      const dayKey = date.toISOString().split("T")[0];

      const dayMeals = mealTypes.map((mealType) => {
        const timeKey = mealType === "早餐" ? "上午" : mealType === "午餐" ? "下午" : "晚上";
        const tip = settings.hungryTimes.includes(timeKey)
          ? hungryTimeTips[timeKey]?.[0]
          : undefined;
        const staple = pickIngredient(staples, i);
        const protein = pickIngredient(proteins, i);
        const primaryVegetable = pickIngredient(vegetables, i * 2);
        const secondaryVegetable = pickIngredient(vegetables, i * 2 + 1);
        const fruit = fruits.length > 0 ? pickIngredient(fruits, i) : null;

        if (mealType === "早餐") {
          return {
            type: mealType,
            main: staple.name,
            side: fruit ? `${protein.name} + ${fruit.name}` : protein.name,
            method: getMethod(staple.category),
            tip,
          };
        }

        if (mealType === "午餐") {
          return {
            type: mealType,
            main: `${primaryVegetable.name} + ${secondaryVegetable.name}`,
            side: `${protein.name} + ${staple.name}`,
            method: getMethod(protein.category),
            tip,
          };
        }

        return {
          type: mealType,
          main: primaryVegetable.name,
          side: `${protein.name} + ${staple.name}（主食可选）`,
          method: getMethod(primaryVegetable.category),
          tip,
        };
      });

      plan.push({
        day: dateStr,
        date: dayKey,
        meals: dayMeals,
      });
    }

    setRecipeWarning("");
    setShoppingNeeds(optionalNeeds);
    setWeeklyPlan(plan);
    setHasGenerated(true);
  };

  const getUsagePlan = () => {
    return ingredients
      .map((ingredient) => {
        const days: string[] = [];
        const maxDays = ingredient.remainingDays <= 2 ? 3 : ingredient.remainingDays <= 5 ? 4 : 5;
        const offset = ingredient.remainingDays > 5 ? 2 : 0;

        for (let i = 0; i < maxDays; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i + offset);
          days.push(date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }));
        }

        return {
          ingredient: ingredient.name,
          days,
          priority: ingredient.remainingDays <= 2 ? 1 : ingredient.remainingDays <= 5 ? 2 : 3,
        };
      })
      .sort((a, b) => a.priority - b.priority);
  };

  const handleDeviceChange = (device: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      devices: checked ? [...prev.devices, device] : prev.devices.filter((item) => item !== device),
    }));
  };

  const handleHungryTimeChange = (time: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      hungryTimes: checked ? [...prev.hungryTimes, time] : prev.hungryTimes.filter((item) => item !== time),
    }));
  };

  const handleMethodChange = (method: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      preferredMethods: checked
        ? [...prev.preferredMethods, method]
        : prev.preferredMethods.filter((item) => item !== method),
    }));
  };

  const filteredIngredients = categoryFilter === "全部"
    ? ingredients
    : ingredients.filter((item) => item.category === categoryFilter);
  const expiringItems = ingredients.filter((item) => item.remainingDays <= 2);
  const usagePlan = getUsagePlan();

  const getMeal = (dayPlan: MealPlan, mealType: string) => {
    return dayPlan.meals.find((meal) => meal.type === mealType);
  };

  const getMealText = (dayPlan: MealPlan, mealType: string) => {
    const meal = getMeal(dayPlan, mealType);
    if (!meal) return "-";
    return meal.side !== "-" ? `${meal.main} + ${meal.side}` : meal.main;
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const recipeDateRange = weeklyPlan.length > 0
    ? `${weeklyPlan[0].day} - ${weeklyPlan[weeklyPlan.length - 1].day}`
    : "";

  const renderMealDetail = (dayPlan: MealPlan, mealType: string, compact = false) => {
    const meal = getMeal(dayPlan, mealType);
    if (!meal) return <span className="text-zinc-400">-</span>;

    return (
      <div className={compact ? "space-y-1" : "space-y-1.5"}>
        <div className="font-medium leading-snug text-zinc-900">{getMealText(dayPlan, mealType)}</div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{meal.method}</span>
        </div>
        {meal.tip && <div className="text-xs leading-snug text-amber-600">{meal.tip}</div>}
      </div>
    );
  };

  const renderRecipeTableView = () => (
    <Card className="recipe-print-card">
      <CardContent className="pt-6">
        <div className="recipe-table-desktop hidden overflow-hidden rounded-lg border border-zinc-200 md:block">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-500">
              <tr>
                <th className="w-28 px-3 py-3">日期</th>
                {mealTypes.map((mealType) => (
                  <th key={mealType} className="px-3 py-3">
                    {mealType}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {weeklyPlan.map((dayPlan) => (
                <tr key={dayPlan.date} className="align-top">
                  <td className="bg-zinc-50 px-3 py-3 font-medium text-zinc-900">{dayPlan.day}</td>
                  {mealTypes.map((mealType) => (
                    <td key={`${dayPlan.date}-${mealType}`} className="px-3 py-3">
                      {renderMealDetail(dayPlan, mealType, true)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="recipe-table-mobile space-y-3 md:hidden">
          {weeklyPlan.map((dayPlan) => (
            <div key={dayPlan.date} className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="mb-3 flex items-center gap-2 font-medium text-zinc-900">
                <Calendar className="h-4 w-4 text-blue-600" />
                {dayPlan.day}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {mealTypes.map((mealType) => (
                  <div key={`${dayPlan.date}-${mealType}`} className="rounded-md bg-zinc-50 p-3">
                    <div className="mb-1 text-xs font-medium text-zinc-500">{mealType}</div>
                    {renderMealDetail(dayPlan, mealType, true)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderRecipeGridView = () => (
    <Card className="recipe-print-card">
      <CardContent className="pt-6">
        <div className="recipe-grid-layout grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {weeklyPlan.flatMap((dayPlan) =>
            mealTypes.map((mealType) => (
              <div
                key={`${dayPlan.date}-${mealType}`}
                className="min-h-28 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-500">{dayPlan.day}</span>
                  <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {mealType}
                  </span>
                </div>
                {renderMealDetail(dayPlan, mealType, true)}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderRecipeCalendarView = () => (
    <Card className="recipe-print-card">
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <div className="recipe-calendar-layout grid min-w-[720px] grid-cols-7 overflow-hidden rounded-lg border border-zinc-200">
            {weeklyPlan.map((dayPlan) => (
              <div key={dayPlan.date} className="border-r border-zinc-200 last:border-r-0">
                <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900">
                  {dayPlan.day}
                </div>
                <div className="divide-y divide-zinc-100">
                  {mealTypes.map((mealType) => (
                    <div key={`${dayPlan.date}-${mealType}`} className="min-h-32 p-3">
                      <div className="mb-2 text-xs font-medium text-zinc-500">{mealType}</div>
                      {renderMealDetail(dayPlan, mealType, true)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="inventory-page max-w-5xl mx-auto space-y-6">
      <div className="inventory-page-header">
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">食材与菜谱</h2>
        <p className="text-zinc-500">管理食材库存，并基于最新库存生成一周菜谱</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="inventory-tabs w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">食材库存</TabsTrigger>
          <TabsTrigger value="recipe">一周菜谱</TabsTrigger>
          <TabsTrigger value="settings">条件设置</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <Card className="no-print">
            <CardHeader>
              <CardTitle>添加食材</CardTitle>
              <CardDescription>添加新的食材到库存</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="col-span-2 md:col-span-2 space-y-2">
                    <Label htmlFor="name">食材名称</Label>
                    <Input
                      id="name"
                      placeholder="例如: 鸡胸肉"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">分类</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">数量</Label>
                    <div className="flex gap-2">
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="500"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                      <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remainingDays">剩余天数</Label>
                    <Input
                      id="remainingDays"
                      type="number"
                      placeholder="3"
                      value={remainingDays}
                      onChange={(e) => setRemainingDays(e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "保存中..." : "添加食材"}
                </Button>

                {saveSuccess && <p className="text-sm text-green-600">添加成功！</p>}
              </form>
            </CardContent>
          </Card>

          {expiringItems.length > 0 && (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  临近过期 ({expiringItems.length} 项)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {expiringItems.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm"
                    >
                      {item.name} · {item.remainingDays}天
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>食材列表</CardTitle>
                <CardDescription>共 {filteredIngredients.length} 项食材</CardDescription>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-zinc-500">加载中...</div>
              ) : filteredIngredients.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">暂无食材，请先添加</div>
              ) : (
                <div className="space-y-2">
                  {filteredIngredients.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <Package className="h-5 w-5 text-zinc-400" />
                        <span className="font-medium">{item.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {item.quantity}{item.unit}
                        </span>
                        {item.remainingDays <= 2 && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {item.remainingDays}天
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setItemToDelete(item);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipe" className="recipe-tab-content space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                当前食材库存
              </CardTitle>
              <CardDescription>共 {ingredients.length} 种食材可用</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-zinc-500">加载中...</div>
              ) : ingredients.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">暂无食材，请先添加食材</div>
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

          <div className="no-print flex justify-center">
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

          {(recipeWarning || shoppingNeeds.length > 0) && (
            <Card className={recipeWarning ? "border-amber-300 bg-amber-50" : "border-blue-200 bg-blue-50"}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${recipeWarning ? "text-amber-700" : "text-blue-700"}`}>
                  <AlertTriangle className="h-5 w-5" />
                  {recipeWarning || "补货建议"}
                </CardTitle>
                <CardDescription className={recipeWarning ? "text-amber-700/80" : "text-blue-700/80"}>
                  {recipeWarning
                    ? "请先补齐核心食材，再生成一周三餐安排"
                    : "当前库存可以生成菜谱，以下食材可按需补充"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {shoppingNeeds.map((need) => (
                    <div
                      key={need.category}
                      className={`rounded-lg border p-3 ${
                        need.priority === "required"
                          ? "border-amber-200 bg-white/70"
                          : "border-blue-200 bg-white/70"
                      }`}
                    >
                      <div className="font-medium text-zinc-900">{need.category}</div>
                      <div className="mt-1 text-sm leading-snug text-zinc-600">{need.reason}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasGenerated && weeklyPlan.length > 0 && (
            <Tabs defaultValue="menu" className="recipe-results-tabs w-full">
              <TabsList className="no-print grid w-full grid-cols-2">
                <TabsTrigger value="menu">一周菜单</TabsTrigger>
                <TabsTrigger value="usage">食材使用计划</TabsTrigger>
              </TabsList>

              <TabsContent value="menu" className="recipe-menu-content space-y-4">
                <div className="no-print flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">一周三餐安排</h3>
                    <p className="text-sm text-zinc-500">切换不同视图查看同一份菜谱</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="grid grid-cols-3 rounded-lg bg-zinc-100 p-1">
                      <Button
                        type="button"
                        variant={recipeView === "table" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setRecipeView("table")}
                        className="gap-1.5"
                      >
                        <Table2 className="h-4 w-4" />
                        表格
                      </Button>
                      <Button
                        type="button"
                        variant={recipeView === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setRecipeView("grid")}
                        className="gap-1.5"
                      >
                        <Grid3X3 className="h-4 w-4" />
                        九宫格
                      </Button>
                      <Button
                        type="button"
                        variant={recipeView === "calendar" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setRecipeView("calendar")}
                        className="gap-1.5"
                      >
                        <Calendar className="h-4 w-4" />
                        日历
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="gap-1.5"
                    >
                      <Printer className="h-4 w-4" />
                      导出 / 保存 PDF
                    </Button>
                  </div>
                </div>

                <div className="recipe-print-area recipe-print-page space-y-4" data-recipe-view={recipeView}>
                  <div className="print-only recipe-print-header">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">好食家一周菜谱</h3>
                      <p className="text-sm text-zinc-500">{recipeDateRange}</p>
                    </div>
                    <div className="text-sm text-zinc-500">
                      当前视图：
                      {recipeView === "table" ? "表格" : recipeView === "grid" ? "九宫格" : "日历"}
                    </div>
                  </div>

                  {recipeView === "table" && renderRecipeTableView()}
                  {recipeView === "grid" && renderRecipeGridView()}
                  {recipeView === "calendar" && renderRecipeCalendarView()}
                </div>
              </TabsContent>

              <TabsContent value="usage" className="no-print space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>食材消耗节奏规划</CardTitle>
                    <CardDescription>优先使用临近过期的食材，避免浪费</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {usagePlan.map((item) => (
                        <div
                          key={item.ingredient}
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
                              <AlertCircle className={item.priority === 1 ? "h-4 w-4 text-red-500" : "h-4 w-4 text-amber-500"} />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium text-zinc-900">{item.ingredient}</span>
                          </div>
                          <div className="text-sm text-zinc-500">建议使用: {item.days.join("、")}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                条件约束设置
              </CardTitle>
              <CardDescription>根据实际情况设置，生成更贴合的菜谱</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>居住场景</Label>
                  <Select
                    value={settings.scenario}
                    onValueChange={(value: UserSettings["scenario"]) =>
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
                      setSettings((prev) => ({ ...prev, availableTime: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>可用设备</Label>
                <div className="flex flex-wrap gap-3">
                  {Object.keys(deviceMethods).map((device) => (
                    <div key={device} className="flex items-center space-x-2">
                      <Checkbox
                        id={`device-${device}`}
                        checked={settings.devices.includes(device)}
                        onCheckedChange={(checked) => handleDeviceChange(device, checked as boolean)}
                      />
                      <label htmlFor={`device-${device}`} className="text-sm font-medium leading-none">
                        {device}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>易饿时段</Label>
                <div className="flex flex-wrap gap-3">
                  {["上午", "下午", "晚上", "睡前"].map((time) => (
                    <div key={time} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hungry-${time}`}
                        checked={settings.hungryTimes.includes(time)}
                        onCheckedChange={(checked) => handleHungryTimeChange(time, checked as boolean)}
                      />
                      <label htmlFor={`hungry-${time}`} className="text-sm font-medium leading-none">
                        {time}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>偏好做法</Label>
                <div className="flex flex-wrap gap-3">
                  {["炒制", "蒸煮", "煎制", "水煮", "空气炸", "微波加热"].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={`method-${method}`}
                        checked={settings.preferredMethods.includes(method)}
                        onCheckedChange={(checked) => handleMethodChange(method, checked as boolean)}
                      />
                      <label htmlFor={`method-${method}`} className="text-sm font-medium leading-none">
                        {method}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveUserSettings} className="bg-green-600 hover:bg-green-700">
                  <Settings className="h-4 w-4 mr-2" />
                  保存设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑食材</DialogTitle>
            <DialogDescription>修改食材信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">食材名称</Label>
              <Input id="editName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>分类</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>数量</Label>
              <div className="flex gap-2">
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>剩余天数</Label>
              <Input type="number" value={remainingDays} onChange={(e) => setRemainingDays(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除「{itemToDelete?.name}」吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
