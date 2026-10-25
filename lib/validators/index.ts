import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name is too short."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["TENANT", "LANDLORD"]),
  budget: z.number().int().positive().optional(),
  preferredCity: z.string().optional(),
  moveDate: z.string().datetime().optional(),
});

export const propertySchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  rent: z.number().int().positive(),
  state: z.string().min(2),
  city: z.string().min(2),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  furnished: z.boolean().default(false),
  photos: z.array(z.string().url()).min(1, "Add at least one photo of the inside."),
  exteriorPhotos: z.array(z.string().url()).max(10).default([]),
  ownershipDocUrl: z.string().url().optional(),
  listingType: z.enum(["RENT", "SALE"]).default("RENT"),
  lodgeType: z
    .enum(["ONE_ROOM", "SELF_CON", "BOYS_QUARTERS", "HOSTEL", "FLAT_2_BED", "FLAT_3_BED", "FLAT_4_BED"])
    .optional(),
  videos: z.array(z.string().url()).max(2, "You can add up to 2 videos.").default([]),
  amenities: z
    .array(z.enum(["RUNNING_WATER", "WATER_HEATER", "OVERHEAD_TANK", "CONSTANT_LIGHT"]))
    .default([]),
  address: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  plusCode: z.string().max(40).optional(),
  landmarkDirections: z.string().max(1000).optional(),
});

export const messageSchema = z.object({
  propertyId: z.string(),
  receiverId: z.string(),
  content: z.string().min(1).max(2000),
});

export const reportSchema = z
  .object({
    reason: z.enum(["scam", "fake_listing", "misleading_details", "harassment", "other"]),
    details: z.string().max(1000).optional(),
    reportedUserId: z.string().optional(),
    propertyId: z.string().optional(),
  })
  .refine((data) => data.reportedUserId || data.propertyId, {
    message: "A report must target a user or a property.",
  });

export const verificationSchema = z.object({
  idDocumentUrl: z.string().url(),
  idType: z.enum(["national_id", "drivers_license"]),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(30).optional().or(z.literal("")),
  bio: z.string().max(600).optional().or(z.literal("")),
  agencyName: z.string().max(120).optional().or(z.literal("")),
  licenseNumber: z.string().max(60).optional().or(z.literal("")),
  emailNotifications: z.boolean().optional(),
});

export const payoutSchema = z.object({
  bankName: z.string().min(2).max(80),
  accountNumber: z.string().regex(/^\d{10}$/, "Account number must be 10 digits."),
  accountName: z.string().min(2).max(120),
});

export const escortSchema = z.object({
  propertyId: z.string(),
  preferredTime: z.string().min(3).max(120),
  note: z.string().max(500).optional(),
});

// Edits: like a new listing, but every field is optional and the optional
// ones can be cleared by sending null.
export const propertyEditSchema = propertySchema.partial().extend({
  lodgeType: propertySchema.shape.lodgeType.nullable(),
  address: z.string().max(300).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  plusCode: z.string().max(40).nullable().optional(),
  landmarkDirections: z.string().max(1000).nullable().optional(),
});

export const roommateProfileSchema = z
  .object({
    mode: z.enum(["NEED_ROOM", "HAVE_ROOM"]),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    genderPref: z.enum(["ANY", "SAME"]),
    area: z.string().min(2).max(80),
    budgetMin: z.number().int().min(0).max(1_000_000_000),
    budgetMax: z.number().int().min(0).max(1_000_000_000),
    moveDate: z.string().optional().or(z.literal("")),
    sleep: z.enum(["EARLY", "NIGHT", "FLEXIBLE"]),
    cleanliness: z.number().int().min(1).max(5),
    smokes: z.boolean(),
    smokingOk: z.boolean(),
    visitors: z.enum(["RARELY", "SOMETIMES", "OFTEN"]),
    bio: z.string().max(500).optional().or(z.literal("")),
    roomDetails: z.string().max(500).optional().or(z.literal("")),
    active: z.boolean().default(true),
    confirm18: z.literal(true, { errorMap: () => ({ message: "You must confirm you are 18 or over." }) }),
  })
  .refine((d) => d.budgetMin <= d.budgetMax, { message: "Minimum budget cannot be above maximum.", path: ["budgetMin"] });

export const roommateMessageSchema = z.object({ content: z.string().min(1).max(1000) });
