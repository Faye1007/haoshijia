"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { addIngredient, getIngredients, updateIngredient, deleteIngredient, Ingredient } from "@/lib/firestore";
import { Package, Edit2, Trash2, AlertTriangle } from "lucide-react";

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

export default function InventoryPage() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("全部");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  useEffect(() => {
    if (user) {
      loadIngredients();
    }
  }, [user, categoryFilter]);

  const loadIngredients = async () => {
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
  };

  const filteredIngredients = categoryFilter === "全部"
    ? ingredients
    : ingredients.filter((i) => i.category === categoryFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setError("请输入食材名称");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("请输入有效的数量");
      return;
    }

    const days = parseInt(remainingDays);
    if (isNaN(days) || days < 0) {
      setError("请输入有��的剩余天数");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await addIngredient(user.uid, {
        name: name.trim(),
        category: category as Ingredient["category"],
        quantity: qty,
        unit,
        remainingDays: days,
      });
      setName("");
      setQuantity("");
      setRemainingDays("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadIngredients();
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

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("请输入有效的数量");
      return;
    }

    const days = parseInt(remainingDays);
    if (isNaN(days) || days < 0) {
      setError("请输入有效的剩余天数");
      return;
    }

    try {
      await updateIngredient(user.uid, editingItem.id, {
        name: name.trim(),
        category: category as Ingredient["category"],
        quantity: qty,
        unit,
        remainingDays: days,
      });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      loadIngredients();
    } catch (err) {
      console.error("更新失败:", err);
      setError("更新失败，请重试");
    }
  };

  const handleDeleteClick = (item: Ingredient) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !itemToDelete) return;
    try {
      await deleteIngredient(user.uid, itemToDelete.id);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      loadIngredients();
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  const getCategoryColor = (cat: string) => {
    return categories.find((c) => c.value === cat)?.color || "bg-zinc-100 text-zinc-700";
  };

  const expiringItems = filteredIngredients.filter((i) => i.remainingDays <= 2);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 pt-8 lg:pt-0">食材库存</h2>
        <p className="text-zinc-500">管理您的食材库存</p>
      </div>

      <Card>
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
                    className="flex-1"
                  />
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
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

            {saveSuccess && (
              <p className="text-sm text-green-600">添加成功！</p>
            )}
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
            <div className="text-center py-8 text-zinc-500">
              暂无食材，请先添加
            </div>
          ) : (
            <div className="space-y-2">
              {filteredIngredients.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(item)}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑食材</DialogTitle>
            <DialogDescription>修改食材信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">食材名称</Label>
              <Input
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1"
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>剩余天数</Label>
              <Input
                type="number"
                value={remainingDays}
                onChange={(e) => setRemainingDays(e.target.value)}
              />
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
              确定要删除"{itemToDelete?.name}"吗？此操作无法撤销。
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