import type { Request, RequestHandler } from "express";
import {
  getProfitDateReport,
  getSalesDateReport,
  getTopSellingProducts,
  type ReportDateRange,
} from "../services/reportService.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/apiResponse.js";

function readDateRange(req: Request): {
  range: ReportDateRange;
  from: string | null;
  to: string | null;
} {
  function parseDay(value: unknown, field: string): {
    raw: string | null;
    date?: Date;
  } {
    if (value === undefined) return { raw: null };

    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      throw new AppError(
        `${field} must use YYYY-MM-DD format`,
        400,
        "INVALID_DATE_RANGE",
      );
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new AppError(
        `${field} is not a valid calendar date`,
        400,
        "INVALID_DATE_RANGE",
      );
    }

    return { raw: value, date };
  }

  const from = parseDay(req.query.from, "from");
  const to = parseDay(req.query.to, "to");

  let toExclusive: Date | undefined;

  if (to.date) {
    toExclusive = new Date(to.date);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  }

  if (from.date && to.date && from.date > to.date) {
    throw new AppError(
      "from must be on or before to",
      400,
      "INVALID_DATE_RANGE",
    );
  }

  return {
    range: { from: from.date, toExclusive },
    from: from.raw,
    to: to.raw,
  };
}

export const getSalesDateReportController: RequestHandler = async (
  req, res, next,
) => {
  try {
    const dates = readDateRange(req);
    const data = await getSalesDateReport(dates.range);
    sendSuccess(res, 200, {
      message: "Sales date-range report retrieved successfully",
      data: { dateRange: { from: dates.from, to: dates.to }, ...data },
    });
  } catch (error) {
    next(error);
  }
};

export const getTopSellingProductsController: RequestHandler = async (
  req, res, next,
) => {
  try {
    const dates = readDateRange(req);
    const parsedLimit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      throw new AppError(
        "limit must be an integer between 1 and 100",
        400,
        "INVALID_LIMIT",
      );
    }

    const products = await getTopSellingProducts(
      dates.range,
      parsedLimit,
    );

    sendSuccess(res, 200, {
      message: "Top-selling products retrieved successfully",
      data: {
        dateRange: { from: dates.from, to: dates.to },
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfitDateReportController: RequestHandler = async (
  req, res, next,
) => {
  try {
    const dates = readDateRange(req);
    const data = await getProfitDateReport(dates.range);

    sendSuccess(res, 200, {
      message: "Profit report retrieved successfully",
      data: { dateRange: { from: dates.from, to: dates.to }, ...data },
    });
  } catch (error) {
    next(error);
  }
};
