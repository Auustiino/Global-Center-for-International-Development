import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  nativeLanguage: text("native_language").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Languages that users are learning
export const userLanguages = pgTable("user_languages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  language: text("language").notNull(),
  proficiency: text("proficiency").notNull(), // beginner, basic, intermediate, advanced, fluent
});

// Call history records
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  initiatorId: integer("initiator_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  initiatorLanguage: text("initiator_language").notNull(), 
  receiverLanguage: text("receiver_language").notNull(),
  duration: integer("duration"),
});

// Define insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertUserLanguageSchema = createInsertSchema(userLanguages).omit({
  id: true,
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
});

// Define update schemas for partial updates
export const updateUserSchema = insertUserSchema.partial();
export const updateUserLanguageSchema = insertUserLanguageSchema.partial();

// Define response schemas
export const userResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string().nullable(),
  email: z.string(),
  bio: z.string().nullable(),
  profilePicture: z.string().nullable(),
  nativeLanguage: z.string(),
  createdAt: z.string(),
  languages: z.array(z.object({
    id: z.number(),
    language: z.string(),
    proficiency: z.string(),
  })).optional(),
});

export const callResponseSchema = z.object({
  id: z.number(),
  initiatorId: z.number(),
  receiverId: z.number(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  initiatorLanguage: z.string(),
  receiverLanguage: z.string(),
  duration: z.number().nullable(),
  initiator: userResponseSchema.omit({ languages: true }).optional(),
  receiver: userResponseSchema.omit({ languages: true }).optional(),
});

// Define types using the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type UserResponse = z.infer<typeof userResponseSchema>;

export type InsertUserLanguage = z.infer<typeof insertUserLanguageSchema>;
export type UpdateUserLanguage = z.infer<typeof updateUserLanguageSchema>;
export type UserLanguage = typeof userLanguages.$inferSelect;

export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;
export type CallResponse = z.infer<typeof callResponseSchema>;

// Language options
export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Mandarin" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
];

export const PROFICIENCY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "fluent", label: "Fluent" },
];
