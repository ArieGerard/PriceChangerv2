import { z } from 'zod';

// Vendor file row (after column mapping)
export const VendorRowSchema = z.object({
    MPN: z.union([z.string(), z.number()]).nullable().optional(),
    Cost: z.number().nonnegative("Cost cannot be negative").nullable().optional(),
    UnitDivider: z.number().positive().nullable().optional(),
}).catchall(z.any()); // Allow additional columns

// Company/QuickBooks row
export const CompanyRowSchema = z.object({
    MPN: z.union([z.string(), z.number()]),
    Item: z.string().min(1, "Item name is required"),
    Description: z.string().optional(),
    PreferredVendor: z.string().optional(),
    Cost: z.number().nonnegative("Cost cannot be negative"),
    Price: z.number().nonnegative("Price cannot be negative"),
    'U/M': z.string().optional(),
}).catchall(z.any());

// Inferred types
export type VendorRow = z.infer<typeof VendorRowSchema>;
export type CompanyRow = z.infer<typeof CompanyRowSchema>;

