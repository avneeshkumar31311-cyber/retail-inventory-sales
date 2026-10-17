import { Sale } from "../models/Sale.js";

export interface ReportDateRange {
  from?: Date;
  toExclusive?: Date;
}

function dateMatch(range: ReportDateRange): Record<string, unknown> {
  const match: Record<string, unknown> = {};
  const createdAt: Record<string, Date> = {};

  if (range.from) createdAt.$gte = range.from;
  if (range.toExclusive) createdAt.$lt = range.toExclusive;
  if (Object.keys(createdAt).length) match.createdAt = createdAt;

  return match;
}

const unitsExpression = {
  $sum: {
    $map: {
      input: "$items",
      as: "item",
      in: "$$item.quantity",
    },
  },
};

export async function getSalesDateReport(range: ReportDateRange) {
  const match = dateMatch(range);
  const [summary, totalSales] = await Promise.all([
    Sale.aggregate<{
      grossSubtotal: number;
      discountAmount: number;
      taxAmount: number;
      totalCollected: number;
      totalUnitsSold: number;
    }>([
      { $match: match },
      {
        $addFields: {
          reportSubtotal: { $ifNull: ["$subtotal", "$totalAmount"] },
          reportDiscount: { $ifNull: ["$discountAmount", 0] },
          reportTax: { $ifNull: ["$taxAmount", 0] },
          reportUnits: unitsExpression,
        },
      },
      {
        $group: {
          _id: null,
          grossSubtotal: { $sum: "$reportSubtotal" },
          discountAmount: { $sum: "$reportDiscount" },
          taxAmount: { $sum: "$reportTax" },
          totalCollected: { $sum: "$totalAmount" },
          totalUnitsSold: { $sum: "$reportUnits" },
        },
      },
    ]),
    Sale.countDocuments(match),
  ]);

  const result = summary[0];
  const grossSubtotal = result?.grossSubtotal ?? 0;
  const discountAmount = result?.discountAmount ?? 0;
  const totalCollected = result?.totalCollected ?? 0;

  return {
    totalSales,
    totalUnitsSold: result?.totalUnitsSold ?? 0,
    grossSubtotal,
    discountAmount,
    netSales: Number((grossSubtotal - discountAmount).toFixed(2)),
    taxAmount: result?.taxAmount ?? 0,
    totalCollected,
    averageOrderValue: totalSales
      ? Number((totalCollected / totalSales).toFixed(2))
      : 0,
  };
}

export async function getTopSellingProducts(
  range: ReportDateRange,
  limit = 10,
) {
  return Sale.aggregate([
    { $match: dateMatch(range) },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        sku: { $first: "$items.sku" },
        unitsSold: { $sum: "$items.quantity" },
        grossSales: { $sum: "$items.subtotal" },
        saleIds: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        product: { $toString: "$_id" },
        productName: 1,
        sku: 1,
        unitsSold: 1,
        grossSales: 1,
        salesCount: { $size: "$saleIds" },
      },
    },
    { $sort: { unitsSold: -1, grossSales: -1 } },
    { $limit: limit },
  ]);
}

export async function getProfitDateReport(range: ReportDateRange) {
  const [result] = await Sale.aggregate([
    { $match: dateMatch(range) },
    {
      $addFields: {
        saleSubtotal: {
          $ifNull: [
            "$subtotal",
            {
              $sum: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: "$$item.subtotal",
                },
              },
            },
          ],
        },
        saleDiscount: { $ifNull: ["$discountAmount", 0] },
      },
    },
    { $unwind: "$items" },
    {
      $addFields: {
        costKnown: {
          $ne: [{ $ifNull: ["$items.unitCost", null] }, null],
        },
        discountForLine: {
          $cond: [
            { $gt: ["$saleSubtotal", 0] },
            {
              $multiply: [
                "$saleDiscount",
                { $divide: ["$items.subtotal", "$saleSubtotal"] },
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        netLineRevenue: {
          $subtract: ["$items.subtotal", "$discountForLine"],
        },
        costAmount: {
          $cond: [
            "$costKnown",
            { $multiply: ["$items.unitCost", "$items.quantity"] },
            0,
          ],
        },
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              saleIds: { $addToSet: "$_id" },
              totalUnits: { $sum: "$items.quantity" },
              unitsWithoutCost: {
                $sum: {
                  $cond: ["$costKnown", 0, "$items.quantity"],
                },
              },
              netSales: { $sum: "$netLineRevenue" },
              revenueWithKnownCost: {
                $sum: {
                  $cond: ["$costKnown", "$netLineRevenue", 0],
                },
              },
              costOfGoods: { $sum: "$costAmount" },
              grossProfitWithKnownCost: {
                $sum: {
                  $cond: [
                    "$costKnown",
                    { $subtract: ["$netLineRevenue", "$costAmount"] },
                    0,
                  ],
                },
              },
            },
          },
        ],
        byProduct: [
          {
            $group: {
              _id: "$items.product",
              productName: { $first: "$items.productName" },
              sku: { $first: "$items.sku" },
              unitsSold: { $sum: "$items.quantity" },
              unitsWithoutCost: {
                $sum: {
                  $cond: ["$costKnown", 0, "$items.quantity"],
                },
              },
              netSales: { $sum: "$netLineRevenue" },
              costOfGoods: { $sum: "$costAmount" },
              grossProfitWithKnownCost: {
                $sum: {
                  $cond: [
                    "$costKnown",
                    { $subtract: ["$netLineRevenue", "$costAmount"] },
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              product: { $toString: "$_id" },
              productName: 1,
              sku: 1,
              unitsSold: 1,
              unitsWithoutCost: 1,
              netSales: 1,
              costOfGoods: 1,
              grossProfitWithKnownCost: 1,
              profitComplete: { $eq: ["$unitsWithoutCost", 0] },
            },
          },
          { $sort: { grossProfitWithKnownCost: -1 } },
        ],
      },
    },
  ]);

  const totals = result?.totals?.[0];
  const unitsWithoutCost = totals?.unitsWithoutCost ?? 0;

  return {
    totalSales: totals?.saleIds?.length ?? 0,
    totalUnits: totals?.totalUnits ?? 0,
    unitsWithoutCost,
    netSales: Number((totals?.netSales ?? 0).toFixed(2)),
    revenueWithKnownCost: Number(
      (totals?.revenueWithKnownCost ?? 0).toFixed(2),
    ),
    costOfGoods: Number((totals?.costOfGoods ?? 0).toFixed(2)),
    grossProfitWithKnownCost: Number(
      (totals?.grossProfitWithKnownCost ?? 0).toFixed(2),
    ),
    profitComplete: unitsWithoutCost === 0,
    products: result?.byProduct ?? [],
  };
}
