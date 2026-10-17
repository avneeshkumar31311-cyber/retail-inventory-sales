import { model, Schema } from "mongoose";

interface IInvoiceCounter {
  _id: string;
  sequence: number;
}

const invoiceCounterSchema = new Schema<IInvoiceCounter>(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, required: true, default: 0, min: 0 },
  },
  { versionKey: false },
);

export const InvoiceCounter = model<IInvoiceCounter>(
  "InvoiceCounter",
  invoiceCounterSchema,
);
