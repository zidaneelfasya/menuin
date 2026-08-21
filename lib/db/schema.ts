import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Example schema, replace with your actual tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
