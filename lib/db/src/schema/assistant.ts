import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const studentProfilesTable = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text("name").notNull(),
  program: text("program").notNull(),
  semester: text("semester").notNull(),
  email: text("email").notNull(),
  goals: text("goals").array().notNull().default([]),
  preferences: text("preferences").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const knowledgeDocumentsTable = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  chunkCount: integer("chunk_count").notNull().default(0),
  wordCount: integer("word_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assistantMessagesTable = pgTable("assistant_messages", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<Array<{
    documentName: string;
    category: string;
    excerpt: string;
  }>>().notNull().default([]),
  toolsUsed: text("tools_used").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentProfileSchema = createInsertSchema(studentProfilesTable).omit({
  id: true,
  updatedAt: true,
});
export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocumentsTable).omit({
  id: true,
  createdAt: true,
});
export const insertAssistantMessageSchema = createInsertSchema(assistantMessagesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;
export type InsertAssistantMessage = z.infer<typeof insertAssistantMessageSchema>;
export type StudentProfile = typeof studentProfilesTable.$inferSelect;
export type KnowledgeDocument = typeof knowledgeDocumentsTable.$inferSelect;
export type AssistantMessage = typeof assistantMessagesTable.$inferSelect;