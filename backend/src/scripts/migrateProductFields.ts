import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Product } from "../models/Product.js";

async function migrateProductFields(): Promise<void> {
  await connectDB();

  const total = await Product.countDocuments();

  const missingSellingPrice = await Product.countDocuments({
    $or: [
      { sellingPrice: { $exists: false } },
      { sellingPrice: null },
    ],
  });

  const missingCategory = await Product.countDocuments({
    $or: [
      { category: { $exists: false } },
      { category: null },
    ],
  });

  const missingActiveStatus = await Product.countDocuments({
    $or: [
      { isActive: { $exists: false } },
      { isActive: null },
    ],
  });

  const inconsistentPrice = await Product.countDocuments({
    $expr: { $ne: ["$price", "$sellingPrice"] },
  });

  console.log("Product migration preview");
  console.log("-------------------------");
  console.log(`Total products: ${total}`);
  console.log(`Missing selling price: ${missingSellingPrice}`);
  console.log(`Missing category: ${missingCategory}`);
  console.log(`Missing active status: ${missingActiveStatus}`);
  console.log(`Price fields needing synchronization: ${inconsistentPrice}`);

  if (!process.argv.includes("--apply")) {
    console.log("");
    console.log("DRY RUN: No database documents were changed.");
    console.log("Review the counts before running with --apply.");
    return;
  }

  const result = await Product.collection.updateMany(
    {
      $or: [
        { sellingPrice: { $exists: false } },
        { sellingPrice: null },
        { category: { $exists: false } },
        { category: null },
        { isActive: { $exists: false } },
        { isActive: null },
        { $expr: { $ne: ["$price", "$sellingPrice"] } },
      ],
    },
    [
      {
        $set: {
          sellingPrice: { $ifNull: ["$sellingPrice", "$price"] },
          price: { $ifNull: ["$sellingPrice", "$price"] },
          category: { $ifNull: ["$category", "Uncategorized"] },
          isActive: { $ifNull: ["$isActive", true] },
        },
      },
    ],
  );

  console.log("");
  console.log("Migration completed.");
  console.log(`Matched documents: ${result.matchedCount}`);
  console.log(`Modified documents: ${result.modifiedCount}`);
  console.log(
    "Purchase prices were not generated or changed.",
  );
}

try {
  await migrateProductFields();
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Unknown error";

  console.error(`Product migration failed: ${message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
