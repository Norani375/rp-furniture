import { dbInventory, dbLedger, dbProduction, dbReports, AFN, persianDate } from '../db/database';
import { calculateProductionCost } from './costing';
import { ProductionRecipe, ProductionOrder } from '../types';

/**
 * Business Logic Layer - Unified & Accurate
 * All business rules, formulas, and triggers go here.
 */

// ============================================
// ۱. PRODUCTION TRIGGER (دقیق و خودکار)
// ============================================
export function executeProduction(recipeId: string, quantity: number) {
  const recipe = dbProduction.getRecipes().find(r => r.id === recipeId);
  if (!recipe) return null;

  const costing = calculateProductionCost({
    materials: recipe.materials,
    outputQuantity: recipe.outputQuantity,
    productionQuantity: quantity,
    laborCost: recipe.laborCost,
    overheadCost: recipe.overheadCost,
    wastePercent: recipe.wastePercent ?? 3,
    profitPercent: recipe.profitPercent ?? 20,
  });

  const inventory = dbInventory.getAll();

  // کسر مواد اولیه
  recipe.materials.forEach(material => {
    const item = inventory.find(i => i.id === material.itemId);
    if (item) {
      const consume = material.quantity * quantity;
      const newQty = Math.max(0, item.quantity - consume);

      dbInventory.update(material.itemId, { quantity: newQty });

      dbLedger.add({
        date: persianDate(),
        type: 'inventory_out',
        status: 'confirmed',
        title: `مصرف ${material.name}`,
        description: `تولید ${recipe.productName} × ${quantity}`,
        debit: 0,
        credit: consume * material.unitCost,
        refType: 'production',
        refId: recipeId,
        createdBy: 'سیستم',
      });
    }
  });

  // افزودن محصول نهایی
  const finished = inventory.find(i => i.name === recipe.productName);
  if (finished) {
    dbInventory.update(finished.id, {
      quantity: finished.quantity + quantity,
    });
  } else {
    dbInventory.add({
      id: 0,
      name: recipe.productName,
      unit: recipe.outputUnit,
      quantity: quantity,
      unitPriceAFN: Math.round(costing.unitCost),
      category: 'محصول نهایی',
    });
  }

  // ثبت تراکنش ورود محصول
  dbLedger.add({
    date: persianDate(),
    type: 'inventory_in',
    status: 'confirmed',
    title: `تولید ${recipe.productName}`,
    description: `مواد: ${AFN(costing.materialCost)} | ضایعات: ${AFN(costing.wasteCost)} | تمام‌شده: ${AFN(costing.unitCost)}`,
    debit: costing.totalCost,
    credit: 0,
    refType: 'production',
    refId: recipeId,
    createdBy: 'سیستم',
  });

  // ذخیره سفارش تولید
  const order: ProductionOrder = {
    id: `PROD-${Date.now().toString().slice(-6)}`,
    recipeId,
    productName: recipe.productName,
    quantity,
    totalCost: costing.totalCost,
    status: 'completed',
    date: persianDate(),
  };

  const orders = [...dbProduction.getOrders(), order];
  dbProduction.saveOrders(orders);

  return { order, costing };
}

// ============================================
// ۲. گزارش‌گیری دقیق و خودکار
// ============================================
export function getPreciseReport() {
  const inventoryValue = dbReports.getRealInventoryValue();
  const cogs = dbReports.getCOGS();
  const profit = dbReports.getProfitLoss();

  const sales = profit.sales;
  const expenses = profit.expenses;
  const netProfit = profit.netProfit;
  const margin = profit.margin;

  return {
    inventoryValue,
    cogs,
    sales,
    expenses,
    grossProfit: profit.grossProfit,
    netProfit,
    margin,
    summary: {
      totalRevenue: sales,
      totalCost: cogs + expenses,
      profit: netProfit,
      profitMargin: margin,
    },
  };
}

// ============================================
// ۳. تریگر خودکار برای موجودی (زمان واقعی)
// ============================================
export function syncInventoryWithLedger() {
  // این تابع می‌تواند در آینده برای همگام‌سازی واقعی استفاده شود
  // فعلاً به صورت خودکار در completeOrder عمل می‌کند
  return true;
}
