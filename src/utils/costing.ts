import { BOMItem } from '../types';

export interface CostingInput {
  materials: BOMItem[];
  outputQuantity: number;
  productionQuantity: number;
  laborCost: number;
  overheadCost: number;
  wastePercent?: number;
  profitPercent?: number;
}

export interface CostingResult {
  materialCost: number;
  wasteCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  unitCost: number;
  suggestedSalePrice: number;
  expectedProfit: number;
}

const safe = (value: number, fallback = 0) => (Number.isFinite(value) ? value : fallback);

export function calculateProductionCost(input: CostingInput): CostingResult {
  const productionQuantity = Math.max(1, safe(input.productionQuantity, 1));
  const outputQuantity = Math.max(1, safe(input.outputQuantity, 1));
  const wastePercent = Math.max(0, safe(input.wastePercent ?? 3, 3));
  const profitPercent = Math.max(0, safe(input.profitPercent ?? 20, 20));

  const materialCost = input.materials.reduce((sum, material) => {
    const qty = Math.max(0, safe(material.quantity));
    const cost = Math.max(0, safe(material.unitCost));
    return sum + qty * cost * productionQuantity;
  }, 0);

  const wasteCost = materialCost * (wastePercent / 100);
  const laborCost = Math.max(0, safe(input.laborCost)) * productionQuantity;
  const overheadCost = Math.max(0, safe(input.overheadCost)) * productionQuantity;
  const totalCost = materialCost + wasteCost + laborCost + overheadCost;
  const producedUnits = productionQuantity * outputQuantity;
  const unitCost = totalCost / producedUnits;
  const suggestedSalePrice = unitCost * (1 + profitPercent / 100);
  const expectedProfit = suggestedSalePrice * producedUnits - totalCost;

  return { materialCost, wasteCost, laborCost, overheadCost, totalCost, unitCost, suggestedSalePrice, expectedProfit };
}

export function calculateGrossProfit(sales: number, cogs: number, expenses = 0) {
  const grossProfit = sales - cogs;
  const netProfit = grossProfit - expenses;
  const margin = sales > 0 ? (netProfit / sales) * 100 : 0;
  return { grossProfit, netProfit, margin };
}
