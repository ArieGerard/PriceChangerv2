import { z } from 'zod';

/**
 * Raw Vendor processing and validation after extraction adn parsing before final normalization
 */

export const VendorRowRawSchema = z.object({
    MPN: z.union([z.string(), z.number()]).refine(
        (val) => val !== null && val !== undefined && val !== '',
        { message: "MPN is required and cannot be empty" }
    ),
    Cost: z.number().nonnegative("Cost cannot be negative"),
    UnitDivider: z.number().positive().nullable(),
});

/** 
* Final vendor row schema after normalization  
*/

export const VendorRowSchema = z.object({
    MPN: z.string().min(1, "MPN is required"),
    Cost: z.number().nonnegative("Cost cannot be negative"),
    UnitDivider: z.number().positive("UnitDivider must be positive"),
    UnitCost: z.number().nonnegative("UnitCost cannot be negative"),
});



 export const CompanyRowRawSchema = z.object({
    MPN: z.union([z.string(), z.number()]).refine(
        (val) => val !== null && val !== undefined && val !== '',
        { message: "MPN is required and cannot be empty" }
    ),
    Item: z.string().refine(
        (val) => val !== null && val !== undefined && val.trim() !== '',
        { message: "Item name is required and cannot be empty" }
    ),
    Description: z.string().nullable().optional(),
    PreferredVendor: z.string().nullable().optional(),
    Cost: z.number().nonnegative("Cost cannot be negative"),
    Price: z.number().nonnegative("Price cannot be negative"),
    'U/M': z.string().nullable().optional(),
});

export const CompanyRowSchema = z.object({
    MPN: z.string().min(1, "MPN is required"),
    Item: z.string().min(1, "Item name is required"),
    Description: z.string().optional(),
    PreferredVendor: z.string().optional(),
    Cost: z.number().nonnegative("Cost cannot be negative"),
    Price: z.number().nonnegative("Price cannot be negative"),
    'U/M': z.string().optional(),
}).catchall(z.any());

// Inferred types

export type VendorRow = z.infer<typeof VendorRowSchema>;
export type VendorRowRaw = z.infer<typeof VendorRowRawSchema>;

export type CompanyRow = z.infer<typeof CompanyRowSchema>;
export type CompanyRowRaw = z.infer<typeof CompanyRowRawSchema>;


