var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  ACTIVITY_LOG_TYPE_LABELS: () => ACTIVITY_LOG_TYPE_LABELS,
  SCAN_CONTEXT_LABELS: () => SCAN_CONTEXT_LABELS,
  TASK_STATUS_LABELS: () => TASK_STATUS_LABELS,
  VALID_TASK_TRANSITIONS: () => VALID_TASK_TRANSITIONS,
  activityLogTypeEnum: () => activityLogTypeEnum,
  activityLogs: () => activityLogs,
  activityLogsRelations: () => activityLogsRelations,
  containerStatusEnum: () => containerStatusEnum,
  customerContainers: () => customerContainers,
  customerContainersRelations: () => customerContainersRelations,
  customers: () => customers,
  customersRelations: () => customersRelations,
  fillHistory: () => fillHistory,
  fillHistoryRelations: () => fillHistoryRelations,
  getTimestampFieldForStatus: () => getTimestampFieldForStatus,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertCustomerContainerSchema: () => insertCustomerContainerSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertFillHistorySchema: () => insertFillHistorySchema,
  insertScanEventSchema: () => insertScanEventSchema,
  insertTaskSchema: () => insertTaskSchema,
  insertUserSchema: () => insertUserSchema,
  insertWarehouseContainerSchema: () => insertWarehouseContainerSchema,
  isValidTaskTransition: () => isValidTaskTransition,
  locationTypeEnum: () => locationTypeEnum,
  priorityEnum: () => priorityEnum,
  quantityUnitEnum: () => quantityUnitEnum,
  scanContextEnum: () => scanContextEnum,
  scanEvents: () => scanEvents,
  scanEventsRelations: () => scanEventsRelations,
  taskStatusEnum: () => taskStatusEnum,
  tasks: () => tasks,
  tasksRelations: () => tasksRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  warehouseContainers: () => warehouseContainers,
  warehouseContainersRelations: () => warehouseContainersRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, real, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var userRoleEnum = pgEnum("user_role", ["ADMIN", "DRIVER"]);
var containerStatusEnum = pgEnum("container_status", [
  "AT_WAREHOUSE",
  // Container is at the warehouse
  "AT_CUSTOMER",
  // Container is at customer location
  "IN_TRANSIT",
  // Container is being transported
  "OUT_OF_SERVICE"
  // Container is not available (maintenance, etc.)
]);
var taskStatusEnum = pgEnum("task_status", [
  "OFFEN",
  // Task created, open and not yet assigned (initial state)
  "PLANNED",
  // Legacy: same as OFFEN (kept for backward compatibility)
  "ASSIGNED",
  // Task assigned to a driver
  "ACCEPTED",
  // Driver has accepted the task (scanned at customer)
  "PICKED_UP",
  // Container picked up from customer
  "IN_TRANSIT",
  // Container being transported to warehouse
  "DELIVERED",
  // Container delivered to warehouse (scanned)
  "COMPLETED",
  // Task fully completed (weight recorded, etc.)
  "CANCELLED"
  // Task was cancelled
]);
var scanContextEnum = pgEnum("scan_context", [
  "WAREHOUSE_INFO",
  // General info scan in warehouse (no task)
  "CUSTOMER_INFO",
  // General info scan at customer (no task)
  "TASK_ACCEPT_AT_CUSTOMER",
  // Driver scans to accept task at customer
  "TASK_PICKUP",
  // Driver scans to confirm pickup
  "TASK_COMPLETE_AT_WAREHOUSE",
  // Driver scans at warehouse to complete delivery
  "INVENTORY_CHECK",
  // Inventory/audit scan
  "MAINTENANCE"
  // Maintenance-related scan
]);
var locationTypeEnum = pgEnum("location_type", [
  "WAREHOUSE",
  "CUSTOMER",
  "OTHER"
]);
var activityLogTypeEnum = pgEnum("activity_log_type", [
  "TASK_CREATED",
  "TASK_ASSIGNED",
  "TASK_ACCEPTED",
  "TASK_PICKED_UP",
  "TASK_IN_TRANSIT",
  "TASK_DELIVERED",
  "TASK_COMPLETED",
  "TASK_CANCELLED",
  "TASK_DELETED",
  "CONTAINER_SCANNED_AT_CUSTOMER",
  "CONTAINER_SCANNED_AT_WAREHOUSE",
  "CONTAINER_STATUS_CHANGED",
  "WEIGHT_RECORDED",
  "MANUAL_EDIT",
  "SYSTEM_EVENT"
]);
var priorityEnum = pgEnum("priority", ["normal", "high", "urgent"]);
var quantityUnitEnum = pgEnum("quantity_unit", ["kg", "t", "m3", "pcs"]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("DRIVER"),
  // ADMIN or DRIVER
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  createdTasks: many(tasks, { relationName: "taskCreator" }),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  scanEvents: many(scanEvents),
  activityLogs: many(activityLogs)
}));
var customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var customersRelations = relations(customers, ({ many }) => ({
  containers: many(customerContainers)
}));
var customerContainers = pgTable("customer_containers", {
  id: varchar("id").primaryKey(),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  // Denormalized for convenience
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  qrCode: text("qr_code").notNull().unique(),
  materialType: text("material_type").notNull(),
  contentDescription: text("content_description"),
  status: text("status").notNull().default("AT_CUSTOMER"),
  // AT_CUSTOMER, IN_TRANSIT, etc.
  lastEmptied: timestamp("last_emptied"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var customerContainersRelations = relations(customerContainers, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerContainers.customerId],
    references: [customers.id]
  }),
  tasks: many(tasks),
  scanEvents: many(scanEvents)
}));
var warehouseContainers = pgTable("warehouse_containers", {
  id: varchar("id").primaryKey(),
  location: text("location").notNull(),
  warehouseZone: text("warehouse_zone"),
  // e.g., "A-17", "Tor 3"
  qrCode: text("qr_code").notNull().unique(),
  materialType: text("material_type").notNull(),
  contentDescription: text("content_description"),
  currentAmount: real("current_amount").notNull().default(0),
  maxCapacity: real("max_capacity").notNull(),
  quantityUnit: text("quantity_unit").notNull().default("kg"),
  // kg, t, m3
  status: text("status").notNull().default("AT_WAREHOUSE"),
  // AT_WAREHOUSE, OUT_OF_SERVICE
  lastEmptied: timestamp("last_emptied"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var warehouseContainersRelations = relations(warehouseContainers, ({ many }) => ({
  tasks: many(tasks),
  fillHistory: many(fillHistory),
  scanEvents: many(scanEvents)
}));
var fillHistory = pgTable("fill_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseContainerId: varchar("warehouse_container_id").notNull().references(() => warehouseContainers.id),
  amountAdded: real("amount_added").notNull(),
  quantityUnit: text("quantity_unit").notNull().default("kg"),
  taskId: varchar("task_id").references(() => tasks.id),
  recordedByUserId: varchar("recorded_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var fillHistoryRelations = relations(fillHistory, ({ one }) => ({
  warehouseContainer: one(warehouseContainers, {
    fields: [fillHistory.warehouseContainerId],
    references: [warehouseContainers.id]
  }),
  task: one(tasks, {
    fields: [fillHistory.taskId],
    references: [tasks.id]
  }),
  recordedBy: one(users, {
    fields: [fillHistory.recordedByUserId],
    references: [users.id]
  })
}));
var tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Task Details
  title: text("title"),
  // Short description, e.g., "Abholung bei ABC GmbH"
  description: text("description"),
  // Detailed description
  // Container References
  containerID: varchar("container_id").notNull().references(() => customerContainers.id),
  deliveryContainerID: varchar("delivery_container_id").references(() => warehouseContainers.id),
  // User References
  createdBy: varchar("created_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  // Planning
  scheduledTime: timestamp("scheduled_time"),
  // Planned execution time
  plannedQuantity: real("planned_quantity"),
  // Expected amount
  plannedQuantityUnit: text("planned_quantity_unit").default("kg"),
  priority: text("priority").notNull().default("normal"),
  // normal, high, urgent
  materialType: text("material_type").notNull(),
  // Status and Lifecycle
  status: text("status").notNull().default("PLANNED"),
  // Lifecycle Timestamps - Set when status changes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  assignedAt: timestamp("assigned_at"),
  acceptedAt: timestamp("accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  inTransitAt: timestamp("in_transit_at"),
  deliveredAt: timestamp("delivered_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  // Legacy fields for backward compatibility
  pickupTimestamp: timestamp("pickup_timestamp"),
  pickupLocation: jsonb("pickup_location"),
  deliveryTimestamp: timestamp("delivery_timestamp"),
  // Actual recorded values
  actualQuantity: real("actual_quantity"),
  // Actually measured amount
  actualQuantityUnit: text("actual_quantity_unit").default("kg"),
  // Additional info
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),
  estimatedAmount: real("estimated_amount"),
  // Legacy, use plannedQuantity
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var tasksRelations = relations(tasks, ({ one, many }) => ({
  container: one(customerContainers, {
    fields: [tasks.containerID],
    references: [customerContainers.id]
  }),
  deliveryContainer: one(warehouseContainers, {
    fields: [tasks.deliveryContainerID],
    references: [warehouseContainers.id]
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "taskCreator"
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "taskAssignee"
  }),
  scanEvents: many(scanEvents),
  activityLogs: many(activityLogs),
  fillHistory: many(fillHistory)
}));
var scanEvents = pgTable("scan_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // What was scanned
  containerId: varchar("container_id").notNull(),
  // Can be customer or warehouse container
  containerType: text("container_type").notNull(),
  // "customer" or "warehouse"
  // Task context (optional - null for info-only scans)
  taskId: varchar("task_id").references(() => tasks.id),
  // Who scanned
  scannedByUserId: varchar("scanned_by_user_id").notNull().references(() => users.id),
  // When and where
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
  // Scan context - what was the purpose of this scan
  scanContext: text("scan_context").notNull(),
  // WAREHOUSE_INFO, TASK_ACCEPT_AT_CUSTOMER, etc.
  // Location information
  locationType: text("location_type").notNull(),
  // WAREHOUSE, CUSTOMER, OTHER
  locationDetails: text("location_details"),
  // Free text, e.g., "Tor 3", "Regal A-17"
  geoLocation: jsonb("geo_location"),
  // { latitude, longitude, accuracy }
  // Scan result
  scanResult: text("scan_result").notNull().default("SUCCESS"),
  // SUCCESS, INVALID_CONTAINER, ERROR
  resultMessage: text("result_message"),
  // Human-readable result description
  // Additional data for debugging/audit
  extraData: jsonb("extra_data"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var scanEventsRelations = relations(scanEvents, ({ one }) => ({
  scannedBy: one(users, {
    fields: [scanEvents.scannedByUserId],
    references: [users.id]
  }),
  task: one(tasks, {
    fields: [scanEvents.taskId],
    references: [tasks.id]
  })
}));
var activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Event classification
  type: text("type").notNull(),
  // TASK_CREATED, TASK_ACCEPTED, CONTAINER_SCANNED_AT_WAREHOUSE, etc.
  action: text("action").notNull(),
  // Legacy field, same as type for backward compatibility
  // Human-readable message for UI display
  message: text("message").notNull(),
  // e.g., "Fahrer Müller hat Container XYZ beim Kunden gescannt"
  // References
  userId: varchar("user_id").references(() => users.id),
  // Who triggered this event
  taskId: varchar("task_id").references(() => tasks.id),
  containerId: varchar("container_id"),
  // Can be customer or warehouse container ID
  scanEventId: varchar("scan_event_id").references(() => scanEvents.id),
  // Link to scan if applicable
  // Location at time of event
  location: jsonb("location"),
  // Additional structured details
  details: text("details"),
  // Legacy field
  metadata: jsonb("metadata"),
  // Additional structured data
  // Timestamp
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  }),
  task: one(tasks, {
    fields: [activityLogs.taskId],
    references: [tasks.id]
  }),
  scanEvent: one(scanEvents, {
    fields: [activityLogs.scanEventId],
    references: [scanEvents.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  phone: true,
  role: true
});
var insertCustomerSchema = createInsertSchema(customers);
var insertCustomerContainerSchema = createInsertSchema(customerContainers);
var insertWarehouseContainerSchema = createInsertSchema(warehouseContainers);
var insertTaskSchema = createInsertSchema(tasks);
var insertScanEventSchema = createInsertSchema(scanEvents);
var insertActivityLogSchema = createInsertSchema(activityLogs);
var insertFillHistorySchema = createInsertSchema(fillHistory);
var VALID_TASK_TRANSITIONS = {
  OFFEN: ["ASSIGNED", "ACCEPTED", "CANCELLED"],
  // New task - can be assigned or directly accepted
  PLANNED: ["ASSIGNED", "ACCEPTED", "CANCELLED"],
  // Legacy: same as OFFEN
  ASSIGNED: ["ACCEPTED", "OFFEN", "PLANNED", "CANCELLED"],
  ACCEPTED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "DELIVERED", "CANCELLED"],
  // Allow skipping IN_TRANSIT for simpler flow
  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  // Terminal state
  CANCELLED: []
  // Terminal state
};
function isValidTaskTransition(currentStatus, newStatus) {
  const validTransitions = VALID_TASK_TRANSITIONS[currentStatus];
  if (!validTransitions) return false;
  return validTransitions.includes(newStatus);
}
function getTimestampFieldForStatus(status) {
  const mapping = {
    ASSIGNED: "assignedAt",
    ACCEPTED: "acceptedAt",
    PICKED_UP: "pickedUpAt",
    IN_TRANSIT: "inTransitAt",
    DELIVERED: "deliveredAt",
    COMPLETED: "completedAt",
    CANCELLED: "cancelledAt"
  };
  return mapping[status] || null;
}
var TASK_STATUS_LABELS = {
  OFFEN: "Offen",
  PLANNED: "Geplant",
  // Legacy, same as OFFEN
  ASSIGNED: "Zugewiesen",
  ACCEPTED: "Angenommen",
  PICKED_UP: "Abgeholt",
  IN_TRANSIT: "Unterwegs",
  DELIVERED: "Geliefert",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert"
};
var SCAN_CONTEXT_LABELS = {
  WAREHOUSE_INFO: "Info-Scan im Lager",
  CUSTOMER_INFO: "Info-Scan beim Kunden",
  TASK_ACCEPT_AT_CUSTOMER: "Auftragsannahme beim Kunden",
  TASK_PICKUP: "Abholung best\xE4tigt",
  TASK_COMPLETE_AT_WAREHOUSE: "Lieferung im Lager",
  INVENTORY_CHECK: "Inventurpr\xFCfung",
  MAINTENANCE: "Wartungsscan"
};
var ACTIVITY_LOG_TYPE_LABELS = {
  TASK_CREATED: "Auftrag erstellt",
  TASK_ASSIGNED: "Auftrag zugewiesen",
  TASK_ACCEPTED: "Auftrag angenommen",
  TASK_PICKED_UP: "Container abgeholt",
  TASK_IN_TRANSIT: "Transport gestartet",
  TASK_DELIVERED: "Container geliefert",
  TASK_COMPLETED: "Auftrag abgeschlossen",
  TASK_CANCELLED: "Auftrag storniert",
  TASK_DELETED: "Auftrag gel\xF6scht",
  CONTAINER_SCANNED_AT_CUSTOMER: "Container beim Kunden gescannt",
  CONTAINER_SCANNED_AT_WAREHOUSE: "Container im Lager gescannt",
  CONTAINER_STATUS_CHANGED: "Container-Status ge\xE4ndert",
  WEIGHT_RECORDED: "Gewicht erfasst",
  MANUAL_EDIT: "Manuelle Bearbeitung",
  SYSTEM_EVENT: "Systemereignis"
};

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. For Supabase, copy the connection string from your Supabase Dashboard \u2192 Settings \u2192 Database \u2192 Connection String (URI format)."
  );
}
var databaseUrl = process.env.DATABASE_URL;
var isSupabase = databaseUrl.includes("supabase") || databaseUrl.includes(":6543");
var poolConfig = {
  connectionString: databaseUrl,
  ...isSupabase && {
    ssl: {
      rejectUnauthorized: false
      // Required for Supabase pooler connections
    }
  }
};
var pool = new Pool(poolConfig);
var db = drizzle(pool, { schema: schema_exports });
async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return { connected: true };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown database error"
    };
  }
}

// server/storage.ts
import { eq, desc, and, gte, lte } from "drizzle-orm";
var DatabaseStorage = class {
  // ============================================================================
  // USERS
  // ============================================================================
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getUsers() {
    return db.select().from(users).where(eq(users.isActive, true));
  }
  async updateUser(id, data) {
    const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  // ============================================================================
  // CUSTOMERS
  // ============================================================================
  async getCustomers() {
    return db.select().from(customers).where(eq(customers.isActive, true));
  }
  async getCustomer(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || void 0;
  }
  async createCustomer(data) {
    const [customer] = await db.insert(customers).values(data).returning();
    return customer;
  }
  async updateCustomer(id, data) {
    const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    const [customer] = await db.update(customers).set(updateData).where(eq(customers.id, id)).returning();
    return customer || void 0;
  }
  // ============================================================================
  // CUSTOMER CONTAINERS
  // ============================================================================
  async getCustomerContainers() {
    return db.select().from(customerContainers).where(eq(customerContainers.isActive, true));
  }
  async getCustomerContainer(id) {
    const [container] = await db.select().from(customerContainers).where(eq(customerContainers.id, id));
    return container || void 0;
  }
  async getCustomerContainerByQR(qrCode) {
    const [container] = await db.select().from(customerContainers).where(eq(customerContainers.qrCode, qrCode));
    return container || void 0;
  }
  async createCustomerContainer(data) {
    const [container] = await db.insert(customerContainers).values(data).returning();
    return container;
  }
  async updateCustomerContainer(id, data) {
    const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    const [container] = await db.update(customerContainers).set(updateData).where(eq(customerContainers.id, id)).returning();
    return container || void 0;
  }
  // ============================================================================
  // WAREHOUSE CONTAINERS
  // ============================================================================
  async getWarehouseContainers() {
    return db.select().from(warehouseContainers).where(eq(warehouseContainers.isActive, true));
  }
  async getWarehouseContainer(id) {
    const [container] = await db.select().from(warehouseContainers).where(eq(warehouseContainers.id, id));
    return container || void 0;
  }
  async getWarehouseContainerByQR(qrCode) {
    const [container] = await db.select().from(warehouseContainers).where(eq(warehouseContainers.qrCode, qrCode));
    return container || void 0;
  }
  async createWarehouseContainer(data) {
    const [container] = await db.insert(warehouseContainers).values(data).returning();
    return container;
  }
  async updateWarehouseContainer(id, data) {
    const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    const [container] = await db.update(warehouseContainers).set(updateData).where(eq(warehouseContainers.id, id)).returning();
    return container || void 0;
  }
  // ============================================================================
  // TASKS
  // ============================================================================
  async getTasks(filters) {
    const conditions = [];
    if (filters?.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(gte(tasks.scheduledTime, startOfDay));
      conditions.push(lte(tasks.scheduledTime, endOfDay));
    }
    if (conditions.length > 0) {
      return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
    }
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }
  async getTask(id) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || void 0;
  }
  async createTask(data) {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }
  async updateTask(id, data) {
    const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return task || void 0;
  }
  /**
   * Update task status with validation and automatic timestamp setting
   * Returns undefined if transition is invalid
   */
  async updateTaskStatus(id, newStatus, userId) {
    const currentTask = await this.getTask(id);
    if (!currentTask) return void 0;
    if (!isValidTaskTransition(currentTask.status, newStatus)) {
      console.warn(`Invalid task transition: ${currentTask.status} -> ${newStatus}`);
      return void 0;
    }
    const updateData = {
      status: newStatus,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const timestampField = getTimestampFieldForStatus(newStatus);
    if (timestampField) {
      updateData[timestampField] = /* @__PURE__ */ new Date();
    }
    if (newStatus === "ASSIGNED" && userId) {
      updateData.assignedTo = userId;
    }
    if (newStatus === "ACCEPTED" && (currentTask.status === "OFFEN" || currentTask.status === "PLANNED") && userId) {
      updateData.assignedTo = userId;
      updateData.assignedAt = /* @__PURE__ */ new Date();
    }
    if (newStatus === "ACCEPTED" && userId && !currentTask.assignedTo) {
      updateData.assignedTo = userId;
      updateData.assignedAt = /* @__PURE__ */ new Date();
    }
    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return task || void 0;
  }
  /**
   * Delete a task and handle related data (scan events, activity logs, fill history)
   * Returns true if the task was deleted, false if not found
   */
  async deleteTask(id) {
    const existingTask = await this.getTask(id);
    if (!existingTask) return false;
    await db.update(scanEvents).set({ taskId: null }).where(eq(scanEvents.taskId, id));
    await db.update(activityLogs).set({ taskId: null }).where(eq(activityLogs.taskId, id));
    await db.update(fillHistory).set({ taskId: null }).where(eq(fillHistory.taskId, id));
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }
  // ============================================================================
  // SCAN EVENTS
  // ============================================================================
  async getScanEvents(filters) {
    const conditions = [];
    if (filters?.containerId) {
      conditions.push(eq(scanEvents.containerId, filters.containerId));
    }
    if (filters?.taskId) {
      conditions.push(eq(scanEvents.taskId, filters.taskId));
    }
    if (filters?.userId) {
      conditions.push(eq(scanEvents.scannedByUserId, filters.userId));
    }
    if (conditions.length > 0) {
      return db.select().from(scanEvents).where(and(...conditions)).orderBy(desc(scanEvents.scannedAt));
    }
    return db.select().from(scanEvents).orderBy(desc(scanEvents.scannedAt));
  }
  async getScanEvent(id) {
    const [event] = await db.select().from(scanEvents).where(eq(scanEvents.id, id));
    return event || void 0;
  }
  async createScanEvent(data) {
    const [event] = await db.insert(scanEvents).values(data).returning();
    return event;
  }
  // ============================================================================
  // ACTIVITY LOGS
  // ============================================================================
  async getActivityLogs(filters) {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId));
    }
    if (filters?.containerId) {
      conditions.push(eq(activityLogs.containerId, filters.containerId));
    }
    if (filters?.type) {
      conditions.push(eq(activityLogs.type, filters.type));
    }
    if (filters?.taskId) {
      conditions.push(eq(activityLogs.taskId, filters.taskId));
    }
    if (conditions.length > 0) {
      return db.select().from(activityLogs).where(and(...conditions)).orderBy(desc(activityLogs.timestamp));
    }
    return db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  }
  async createActivityLog(data) {
    const logData = {
      ...data,
      action: data.action || data.type
    };
    const [log2] = await db.insert(activityLogs).values(logData).returning();
    return log2;
  }
  // ============================================================================
  // FILL HISTORY
  // ============================================================================
  async getFillHistory(warehouseContainerId) {
    return db.select().from(fillHistory).where(eq(fillHistory.warehouseContainerId, warehouseContainerId)).orderBy(desc(fillHistory.createdAt));
  }
  async createFillHistory(data) {
    const [history] = await db.insert(fillHistory).values(data).returning();
    return history;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { createHash } from "crypto";
function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}
async function requireAuth(req, res, next) {
  const userId = req.headers["x-user-id"] || req.body?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "Invalid user" });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: "Account is deactivated" });
  }
  req.authUser = user;
  next();
}
function requireAdmin(req, res, next) {
  const user = req.authUser;
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const role = user.role?.toUpperCase();
  if (role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
function normalizeUserRole(user) {
  return {
    ...user,
    role: user.role?.toLowerCase() || "driver"
  };
}
function prepareUserResponse(user) {
  const { password, ...userWithoutPassword } = user;
  return normalizeUserRole(userWithoutPassword);
}
async function registerRoutes(app2) {
  app2.head("/api/health", (req, res) => {
    res.status(200).end();
  });
  app2.get("/api/health", async (req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      if (dbHealth.connected) {
        res.status(200).json({
          status: "ok",
          database: "connected",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        res.status(503).json({
          status: "degraded",
          database: "disconnected",
          error: dbHealth.error,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        status: "error",
        database: "unknown",
        error: error instanceof Error ? error.message : "Health check failed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/auth/replit", (req, res) => {
    const userId = req.headers["x-replit-user-id"];
    const userName = req.headers["x-replit-user-name"];
    const userRoles = req.headers["x-replit-user-roles"];
    if (!userId || !userName) {
      return res.status(401).json({
        error: "Not authenticated with Replit",
        authenticated: false
      });
    }
    res.json({
      authenticated: true,
      replitUser: {
        id: userId,
        name: userName,
        roles: userRoles ? userRoles.split(",") : []
      }
    });
  });
  app2.post("/api/auth/replit/login", async (req, res) => {
    try {
      const userId = req.headers["x-replit-user-id"];
      const userName = req.headers["x-replit-user-name"];
      if (!userId || !userName) {
        return res.status(401).json({ error: "Not authenticated with Replit" });
      }
      const replitId = `replit-${userId}`;
      const replitEmail = `${userName}@replit.user`;
      let user = await storage.getUserByEmail(replitEmail);
      if (!user) {
        const existingUsers = await storage.getUsers();
        const isFirstUser = existingUsers.length === 0;
        user = await storage.createUser({
          email: replitEmail,
          password: hashPassword(`replit-${userId}-${Date.now()}`),
          name: userName,
          role: isFirstUser ? "admin" : "driver"
        });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }
      res.json({ user: prepareUserResponse(user) });
    } catch (error) {
      console.error("Replit auth error:", error);
      res.status(500).json({ error: "Replit login failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }
      res.json({ user: prepareUserResponse(user) });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const usersWithoutPasswords = users2.map((user) => prepareUserResponse(user));
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(prepareUserResponse(user));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: role || "driver"
      });
      res.status(201).json(prepareUserResponse(user));
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  app2.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(prepareUserResponse(user));
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app2.get("/api/customers", async (req, res) => {
    try {
      const customerList = await storage.getCustomers();
      res.json(customerList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  app2.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });
  app2.post("/api/customers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { name, address, contactName, contactPhone, contactEmail, notes } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Customer name is required" });
      }
      const customer = await storage.createCustomer({
        name,
        address: address || null,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        notes: notes || null,
        isActive: true
      });
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create customer" });
    }
  });
  app2.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });
  app2.get("/api/containers/customer", async (req, res) => {
    try {
      const containers = await storage.getCustomerContainers();
      res.json(containers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer containers" });
    }
  });
  app2.get("/api/containers/customer/:id", async (req, res) => {
    try {
      const container = await storage.getCustomerContainer(req.params.id);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch container" });
    }
  });
  app2.get("/api/containers/customer/qr/:qrCode", async (req, res) => {
    try {
      let container = await storage.getCustomerContainerByQR(req.params.qrCode);
      if (!container) {
        container = await storage.getCustomerContainer(req.params.qrCode);
      }
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch container" });
    }
  });
  app2.post("/api/containers/customer", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id, ...rest } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Container ID is required" });
      }
      const stableQrCode = `customer-${id}`;
      const container = await storage.createCustomerContainer({
        id,
        ...rest,
        qrCode: stableQrCode
        // Always use stable QR code
      });
      res.status(201).json(container);
    } catch (error) {
      console.error("Error creating customer container:", error);
      res.status(500).json({ error: "Failed to create container" });
    }
  });
  app2.patch("/api/containers/customer/:id", async (req, res) => {
    try {
      const { qrCode, ...updateData } = req.body;
      const container = await storage.updateCustomerContainer(req.params.id, updateData);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to update container" });
    }
  });
  app2.post("/api/containers/customer/:id/regenerate-qr", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      const existingContainer = await storage.getCustomerContainer(req.params.id);
      if (!existingContainer) {
        return res.status(404).json({ error: "Container not found" });
      }
      const oldQrCode = existingContainer.qrCode;
      const newQrCode = `customer-${req.params.id}-${Date.now()}`;
      const container = await storage.updateCustomerContainer(req.params.id, {
        qrCode: newQrCode
      });
      if (!container) {
        return res.status(500).json({ error: "Failed to regenerate QR code" });
      }
      await storage.createActivityLog({
        type: "SYSTEM_EVENT",
        action: "SYSTEM_EVENT",
        message: `QR-Code f\xFCr Container ${req.params.id} wurde neu generiert. Bitte neuen Code ausdrucken und am Container anbringen.`,
        userId: userId || null,
        taskId: null,
        containerId: req.params.id,
        scanEventId: null,
        location: null,
        timestamp: /* @__PURE__ */ new Date(),
        details: `Alter QR-Code: ${oldQrCode}`,
        metadata: { oldQrCode, newQrCode, action: "QR_CODE_REGENERATED" }
      });
      res.json(container);
    } catch (error) {
      console.error("Error regenerating QR code:", error);
      res.status(500).json({ error: "Failed to regenerate QR code" });
    }
  });
  app2.get("/api/containers/warehouse", async (req, res) => {
    try {
      const containers = await storage.getWarehouseContainers();
      res.json(containers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouse containers" });
    }
  });
  app2.get("/api/containers/warehouse/:id", async (req, res) => {
    try {
      const container = await storage.getWarehouseContainer(req.params.id);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch container" });
    }
  });
  app2.get("/api/containers/warehouse/qr/:qrCode", async (req, res) => {
    try {
      let container = await storage.getWarehouseContainerByQR(req.params.qrCode);
      if (!container) {
        container = await storage.getWarehouseContainer(req.params.qrCode);
      }
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch container" });
    }
  });
  app2.post("/api/containers/warehouse", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id, ...rest } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Container ID is required" });
      }
      const stableQrCode = `warehouse-${id}`;
      const container = await storage.createWarehouseContainer({
        id,
        ...rest,
        qrCode: stableQrCode
        // Always use stable QR code
      });
      res.status(201).json(container);
    } catch (error) {
      console.error("Error creating warehouse container:", error);
      res.status(500).json({ error: "Failed to create container" });
    }
  });
  app2.patch("/api/containers/warehouse/:id", async (req, res) => {
    try {
      const { qrCode, ...updateData } = req.body;
      const container = await storage.updateWarehouseContainer(req.params.id, updateData);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      console.error("Error updating warehouse container:", error);
      res.status(500).json({ error: "Failed to update container", details: String(error) });
    }
  });
  app2.post("/api/containers/warehouse/:id/regenerate-qr", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      const existingContainer = await storage.getWarehouseContainer(req.params.id);
      if (!existingContainer) {
        return res.status(404).json({ error: "Container not found" });
      }
      const oldQrCode = existingContainer.qrCode;
      const newQrCode = `warehouse-${req.params.id}-${Date.now()}`;
      const container = await storage.updateWarehouseContainer(req.params.id, {
        qrCode: newQrCode
      });
      if (!container) {
        return res.status(500).json({ error: "Failed to regenerate QR code" });
      }
      await storage.createActivityLog({
        type: "SYSTEM_EVENT",
        action: "SYSTEM_EVENT",
        message: `QR-Code f\xFCr Container ${req.params.id} wurde neu generiert. Bitte neuen Code ausdrucken und am Container anbringen.`,
        userId: userId || null,
        taskId: null,
        containerId: req.params.id,
        scanEventId: null,
        location: null,
        timestamp: /* @__PURE__ */ new Date(),
        details: `Alter QR-Code: ${oldQrCode}`,
        metadata: { oldQrCode, newQrCode, action: "QR_CODE_REGENERATED" }
      });
      res.json(container);
    } catch (error) {
      console.error("Error regenerating QR code:", error);
      res.status(500).json({ error: "Failed to regenerate QR code" });
    }
  });
  app2.post("/api/containers/warehouse/:id/reset", requireAuth, async (req, res) => {
    try {
      const { reason } = req.body;
      const authUser = req.authUser;
      const userRole = authUser?.role?.toLowerCase();
      if (!authUser || userRole !== "admin" && userRole !== "driver") {
        return res.status(403).json({ error: "Only admin or driver roles can empty containers" });
      }
      const existingContainer = await storage.getWarehouseContainer(req.params.id);
      if (!existingContainer) {
        return res.status(404).json({ error: "Container not found" });
      }
      if (existingContainer.currentAmount === 0) {
        return res.json({
          message: "Container is already empty",
          container: existingContainer
        });
      }
      const previousAmount = existingContainer.currentAmount;
      const container = await storage.updateWarehouseContainer(req.params.id, {
        currentAmount: 0,
        lastEmptied: /* @__PURE__ */ new Date()
      });
      if (!container) {
        return res.status(500).json({ error: "Failed to reset container" });
      }
      await storage.createFillHistory({
        warehouseContainerId: req.params.id,
        amountAdded: -previousAmount,
        quantityUnit: existingContainer.quantityUnit,
        taskId: null,
        recordedByUserId: authUser?.id || null
      });
      const roleLabel = userRole === "admin" ? "Admin" : "Fahrer";
      await storage.createActivityLog({
        type: "CONTAINER_STATUS_CHANGED",
        action: "CONTAINER_STATUS_CHANGED",
        message: `Lagercontainer ${req.params.id} wurde von ${roleLabel} ${authUser?.name || "Unbekannt"} geleert (${previousAmount} ${existingContainer.quantityUnit} entfernt)`,
        userId: authUser?.id || null,
        taskId: null,
        containerId: req.params.id,
        scanEventId: null,
        location: null,
        timestamp: /* @__PURE__ */ new Date(),
        details: reason || null,
        metadata: { previousAmount, reason, action: "CONTAINER_EMPTIED", role: authUser.role }
      });
      res.json({
        message: "Container successfully emptied",
        container
      });
    } catch (error) {
      console.error("Error resetting warehouse container:", error);
      res.status(500).json({ error: "Failed to reset container" });
    }
  });
  app2.get("/api/containers/warehouse/:id/history", async (req, res) => {
    try {
      const history = await storage.getFillHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fill history" });
    }
  });
  app2.get("/api/tasks", async (req, res) => {
    try {
      const { assignedTo, status, date, showAll } = req.query;
      const userId = req.headers["x-user-id"] || req.query.userId;
      let userRole = "DRIVER";
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          userRole = user.role?.toUpperCase() || "DRIVER";
        }
      }
      const filters = {};
      if (userRole === "ADMIN") {
        if (assignedTo) filters.assignedTo = assignedTo;
        if (status) {
          filters.status = status;
        }
      } else {
        if (userId) {
          filters.assignedTo = userId;
        } else if (assignedTo) {
          filters.assignedTo = assignedTo;
        }
        if (status) filters.status = status;
      }
      if (date) filters.date = new Date(date);
      let taskList = await storage.getTasks(Object.keys(filters).length > 0 ? filters : void 0);
      if (userRole === "ADMIN" && !status && showAll !== "true") {
        const FINAL_STATUSES = ["COMPLETED", "CANCELLED"];
        taskList = taskList.filter((t) => !FINAL_STATUSES.includes(t.status));
      }
      res.json(taskList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
  app2.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });
  app2.post("/api/tasks", requireAuth, requireAdmin, async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        status: "OFFEN"
        // Always start with OFFEN - never trust client status
      };
      if (taskData.scheduledTime) {
        const parsedDate = new Date(taskData.scheduledTime);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ error: "Invalid scheduledTime format" });
        }
        taskData.scheduledTime = parsedDate;
      }
      const timestampFields = [
        "assignedAt",
        "acceptedAt",
        "pickedUpAt",
        "inTransitAt",
        "deliveredAt",
        "completedAt",
        "cancelledAt",
        "pickupTimestamp",
        "deliveryTimestamp"
      ];
      for (const field of timestampFields) {
        if (taskData[field]) {
          const parsedDate = new Date(taskData[field]);
          if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: `Invalid ${field} format` });
          }
          taskData[field] = parsedDate;
        }
      }
      if (taskData.deliveryContainerID && taskData.plannedQuantity) {
        const targetContainer = await storage.getWarehouseContainer(taskData.deliveryContainerID);
        if (!targetContainer) {
          return res.status(400).json({ error: "Zielcontainer nicht gefunden" });
        }
        const remainingCapacity = targetContainer.maxCapacity - targetContainer.currentAmount;
        if (taskData.plannedQuantity > remainingCapacity) {
          return res.status(400).json({
            error: "Zielcontainer hat nicht genug \xFCbriges Volumen f\xFCr diese Menge.",
            remainingCapacity,
            requestedAmount: taskData.plannedQuantity,
            unit: targetContainer.quantityUnit
          });
        }
      }
      const task = await storage.createTask(taskData);
      await storage.createActivityLog({
        type: "TASK_CREATED",
        action: "TASK_CREATED",
        message: `Auftrag erstellt f\xFCr Container ${task.containerID}`,
        userId: req.body.createdBy || null,
        taskId: task.id,
        containerId: task.containerID,
        timestamp: /* @__PURE__ */ new Date(),
        details: null,
        metadata: null,
        location: null,
        scanEventId: null
      });
      res.status(201).json(task);
    } catch (error) {
      console.error("Failed to create task:", error);
      res.status(500).json({ error: "Failed to create task", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });
  app2.delete("/api/tasks/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const authUser = req.authUser;
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Auftrag nicht gefunden" });
      }
      const deleted = await storage.deleteTask(taskId);
      if (!deleted) {
        return res.status(500).json({ error: "Fehler beim L\xF6schen des Auftrags" });
      }
      await storage.createActivityLog({
        type: "TASK_DELETED",
        action: "TASK_DELETED",
        message: `Auftrag ${taskId} wurde von Admin ${authUser?.name || "Unbekannt"} gel\xF6scht`,
        userId: authUser?.id || null,
        taskId: null,
        // Task no longer exists
        containerId: task.containerID,
        scanEventId: null,
        location: null,
        timestamp: /* @__PURE__ */ new Date(),
        details: `Status vor L\xF6schung: ${task.status}`,
        metadata: {
          deletedTaskId: taskId,
          taskStatus: task.status,
          containerId: task.containerID,
          assignedTo: task.assignedTo
        }
      });
      res.json({ message: "Auftrag erfolgreich gel\xF6scht" });
    } catch (error) {
      console.error("Failed to delete task:", error);
      res.status(500).json({ error: "Fehler beim L\xF6schen des Auftrags" });
    }
  });
  app2.post("/api/tasks/:id/assign", async (req, res) => {
    try {
      const { userId, assignedBy } = req.body;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      const updatedTask = await storage.updateTaskStatus(req.params.id, "ASSIGNED", userId);
      if (!updatedTask) {
        return res.status(400).json({ error: "Invalid status transition" });
      }
      const driver = await storage.getUser(userId);
      const driverName = driver?.name || "Unbekannt";
      await storage.createActivityLog({
        type: "TASK_ASSIGNED",
        action: "TASK_ASSIGNED",
        message: `Auftrag ${task.id} wurde Fahrer ${driverName} zugewiesen`,
        userId: assignedBy || null,
        taskId: task.id,
        containerId: task.containerID,
        timestamp: /* @__PURE__ */ new Date(),
        details: null,
        metadata: null,
        location: null,
        scanEventId: null
      });
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign task" });
    }
  });
  app2.post("/api/tasks/:id/accept", async (req, res) => {
    try {
      const { userId, location, geoLocation } = req.body;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Benutzer nicht gefunden" });
      }
      const userRole = user.role?.toUpperCase() || "DRIVER";
      const isAdmin = userRole === "ADMIN";
      const isAssignedDriver = task.assignedTo === userId;
      if (!isAdmin && !isAssignedDriver && task.assignedTo) {
        return res.status(403).json({
          error: "Nur der zugewiesene Fahrer oder ein Admin kann diesen Auftrag annehmen.",
          assignedTo: task.assignedTo
        });
      }
      const LATER_STATES = ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"];
      if (LATER_STATES.includes(task.status)) {
        const sourceContainer2 = await storage.getCustomerContainer(task.containerID);
        let targetContainer2 = null;
        if (task.deliveryContainerID) {
          targetContainer2 = await storage.getWarehouseContainer(task.deliveryContainerID);
        }
        const response2 = {
          task,
          alreadyAccepted: true,
          sourceContainer: sourceContainer2 ? {
            id: sourceContainer2.id,
            label: sourceContainer2.id,
            location: sourceContainer2.location,
            content: sourceContainer2.materialType,
            materialType: sourceContainer2.materialType,
            customerName: sourceContainer2.customerName,
            unit: task.plannedQuantityUnit || "kg",
            currentQuantity: task.estimatedAmount || 0,
            plannedPickupQuantity: task.plannedQuantity || task.estimatedAmount || 0
          } : null
        };
        if (targetContainer2) {
          response2.targetContainer = {
            id: targetContainer2.id,
            label: targetContainer2.id,
            location: targetContainer2.location,
            content: targetContainer2.materialType,
            materialType: targetContainer2.materialType,
            capacity: targetContainer2.maxCapacity,
            currentFill: targetContainer2.currentAmount,
            remainingCapacity: targetContainer2.maxCapacity - targetContainer2.currentAmount,
            unit: targetContainer2.quantityUnit
          };
        }
        return res.json(response2);
      }
      const sourceContainer = await storage.getCustomerContainer(task.containerID);
      if (!sourceContainer) {
        return res.status(404).json({ error: "Kundencontainer nicht gefunden" });
      }
      let targetContainer = null;
      if (task.deliveryContainerID) {
        targetContainer = await storage.getWarehouseContainer(task.deliveryContainerID);
        if (targetContainer) {
          if (sourceContainer.materialType !== targetContainer.materialType) {
            return res.status(400).json({
              error: "Der Zielcontainer enth\xE4lt ein anderes Material. Bitte w\xE4hle einen passenden Lagercontainer.",
              sourceMaterial: sourceContainer.materialType,
              targetMaterial: targetContainer.materialType
            });
          }
          const remainingCapacity = targetContainer.maxCapacity - targetContainer.currentAmount;
          if (task.plannedQuantity && task.plannedQuantity > remainingCapacity) {
            return res.status(400).json({
              error: "Zielcontainer hat nicht genug \xFCbriges Volumen f\xFCr diese Menge.",
              remainingCapacity,
              requestedAmount: task.plannedQuantity,
              unit: targetContainer.quantityUnit
            });
          }
        }
      }
      const updatedTask = await storage.updateTaskStatus(req.params.id, "ACCEPTED", userId);
      if (!updatedTask) {
        return res.status(400).json({ error: "Ung\xFCltiger Status-\xDCbergang. Aktueller Status: " + task.status });
      }
      await storage.updateTask(req.params.id, {
        pickupLocation: location
      });
      const scanEvent = await storage.createScanEvent({
        containerId: task.containerID,
        containerType: "customer",
        taskId: task.id,
        scannedByUserId: userId,
        scannedAt: /* @__PURE__ */ new Date(),
        scanContext: "TASK_ACCEPT_AT_CUSTOMER",
        locationType: "CUSTOMER",
        locationDetails: location,
        geoLocation: geoLocation || null,
        scanResult: "SUCCESS",
        resultMessage: null,
        extraData: null
      });
      const driver = await storage.getUser(userId);
      const driverName = driver?.name || "Unbekannt";
      await storage.createActivityLog({
        type: "TASK_ACCEPTED",
        action: "TASK_ACCEPTED",
        message: `Fahrer ${driverName} hat Auftrag ${task.id} beim Kunden angenommen`,
        userId,
        taskId: task.id,
        containerId: task.containerID,
        scanEventId: scanEvent.id,
        location: geoLocation || null,
        timestamp: /* @__PURE__ */ new Date(),
        details: null,
        metadata: { autoAssigned: task.status === "PLANNED" }
      });
      const response = {
        task: updatedTask,
        sourceContainer: {
          id: sourceContainer.id,
          label: sourceContainer.id,
          location: sourceContainer.location,
          content: sourceContainer.materialType,
          // content field maps to materialType
          materialType: sourceContainer.materialType,
          customerName: sourceContainer.customerName,
          unit: updatedTask.plannedQuantityUnit || "kg",
          currentQuantity: updatedTask.estimatedAmount || 0,
          plannedPickupQuantity: updatedTask.plannedQuantity || updatedTask.estimatedAmount || 0
        }
      };
      if (targetContainer) {
        response.targetContainer = {
          id: targetContainer.id,
          label: targetContainer.id,
          location: targetContainer.location,
          content: targetContainer.materialType,
          // content field maps to materialType
          materialType: targetContainer.materialType,
          capacity: targetContainer.maxCapacity,
          currentFill: targetContainer.currentAmount,
          remainingCapacity: targetContainer.maxCapacity - targetContainer.currentAmount,
          unit: targetContainer.quantityUnit
        };
      }
      res.json(response);
    } catch (error) {
      console.error("Failed to accept task:", error);
      res.status(500).json({ error: "Fehler beim Annehmen des Auftrags" });
    }
  });
  app2.post("/api/tasks/:id/pickup", async (req, res) => {
    try {
      const { userId, location, geoLocation } = req.body;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Benutzer nicht gefunden" });
      }
      const userRole = user.role?.toUpperCase() || "DRIVER";
      const isAdmin = userRole === "ADMIN";
      const isAssignedDriver = task.assignedTo === userId;
      if (!isAdmin && !isAssignedDriver) {
        return res.status(403).json({
          error: "Nur der zugewiesene Fahrer oder ein Admin kann diesen Auftrag abholen.",
          assignedTo: task.assignedTo
        });
      }
      const LATER_STATES = ["PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"];
      if (LATER_STATES.includes(task.status)) {
        return res.json({ ...task, alreadyPickedUp: true });
      }
      if (task.status !== "ACCEPTED") {
        return res.status(400).json({
          error: "Auftrag muss zuerst angenommen werden bevor er abgeholt werden kann",
          currentStatus: task.status
        });
      }
      const updatedTask = await storage.updateTaskStatus(req.params.id, "PICKED_UP", userId);
      if (!updatedTask) {
        return res.status(400).json({ error: "Ung\xFCltiger Status-\xDCbergang" });
      }
      const scanEvent = await storage.createScanEvent({
        containerId: task.containerID,
        containerType: "customer",
        taskId: task.id,
        scannedByUserId: userId,
        scannedAt: /* @__PURE__ */ new Date(),
        scanContext: "TASK_PICKUP",
        locationType: "CUSTOMER",
        locationDetails: location,
        geoLocation: geoLocation || null,
        scanResult: "SUCCESS",
        resultMessage: null,
        extraData: null
      });
      const driver = await storage.getUser(userId);
      const driverName = driver?.name || "Unbekannt";
      await storage.createActivityLog({
        type: "TASK_PICKED_UP",
        action: "TASK_PICKED_UP",
        message: `Fahrer ${driverName} hat Container ${task.containerID} abgeholt`,
        userId,
        taskId: task.id,
        containerId: task.containerID,
        scanEventId: scanEvent.id,
        location: geoLocation || null,
        timestamp: /* @__PURE__ */ new Date(),
        details: null,
        metadata: null
      });
      res.json(updatedTask);
    } catch (error) {
      console.error("Failed to pickup task:", error);
      res.status(500).json({ error: "Fehler beim Abholen des Containers" });
    }
  });
  app2.post("/api/tasks/:id/delivery", async (req, res) => {
    try {
      const { userId, warehouseContainerId, amount, location, geoLocation } = req.body;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Benutzer nicht gefunden" });
      }
      const userRole = user.role?.toUpperCase() || "DRIVER";
      const isAdmin = userRole === "ADMIN";
      const isAssignedDriver = task.assignedTo === userId;
      if (!isAdmin && !isAssignedDriver) {
        return res.status(403).json({
          error: "Nur der zugewiesene Fahrer oder ein Admin kann diesen Auftrag abliefern.",
          assignedTo: task.assignedTo
        });
      }
      if (task.status === "COMPLETED") {
        return res.json({ ...task, alreadyCompleted: true });
      }
      const warehouseContainer = await storage.getWarehouseContainer(warehouseContainerId);
      if (!warehouseContainer) {
        return res.status(404).json({ error: "Lagercontainer nicht gefunden" });
      }
      if (warehouseContainer.materialType !== task.materialType) {
        return res.status(400).json({
          error: "Der Zielcontainer enth\xE4lt ein anderes Material. Bitte w\xE4hle einen passenden Lagercontainer.",
          sourceMaterial: task.materialType,
          targetMaterial: warehouseContainer.materialType
        });
      }
      const deliveredAmount = amount || task.plannedQuantity || task.estimatedAmount || 0;
      const availableSpace = warehouseContainer.maxCapacity - warehouseContainer.currentAmount;
      if (deliveredAmount > availableSpace) {
        return res.status(400).json({
          error: "Zielcontainer hat nicht genug \xFCbriges Volumen f\xFCr diese Menge.",
          remainingCapacity: availableSpace,
          requestedAmount: deliveredAmount,
          unit: warehouseContainer.quantityUnit
        });
      }
      let updatedTask = await storage.updateTaskStatus(req.params.id, "DELIVERED");
      if (!updatedTask) {
        return res.status(400).json({ error: "Ung\xFCltiger Status-\xDCbergang" });
      }
      await storage.updateTask(req.params.id, {
        deliveryContainerID: warehouseContainerId
      });
      const scanEvent = await storage.createScanEvent({
        containerId: warehouseContainerId,
        containerType: "warehouse",
        taskId: task.id,
        scannedByUserId: userId,
        scannedAt: /* @__PURE__ */ new Date(),
        scanContext: "TASK_COMPLETE_AT_WAREHOUSE",
        locationType: "WAREHOUSE",
        locationDetails: warehouseContainer.warehouseZone || location,
        geoLocation: geoLocation || null,
        scanResult: "SUCCESS",
        resultMessage: null,
        extraData: null
      });
      await storage.createActivityLog({
        type: "TASK_DELIVERED",
        action: "TASK_DELIVERED",
        message: `Container ${task.containerID} wurde im Lager abgeliefert`,
        userId,
        taskId: task.id,
        containerId: warehouseContainerId,
        scanEventId: scanEvent.id,
        location: geoLocation || null,
        timestamp: /* @__PURE__ */ new Date(),
        details: null,
        metadata: null
      });
      const newAmount = warehouseContainer.currentAmount + deliveredAmount;
      await storage.updateWarehouseContainer(warehouseContainerId, {
        currentAmount: newAmount
      });
      await storage.createFillHistory({
        warehouseContainerId,
        amountAdded: deliveredAmount,
        quantityUnit: warehouseContainer.quantityUnit,
        taskId: task.id,
        recordedByUserId: userId
      });
      await storage.updateCustomerContainer(task.containerID, {
        lastEmptied: /* @__PURE__ */ new Date(),
        status: "AT_CUSTOMER"
      });
      await storage.updateTask(req.params.id, {
        actualQuantity: deliveredAmount
      });
      updatedTask = await storage.updateTaskStatus(req.params.id, "COMPLETED");
      if (!updatedTask) {
        return res.status(400).json({ error: "Fehler beim Abschlie\xDFen des Auftrags" });
      }
      await storage.createActivityLog({
        type: "TASK_COMPLETED",
        action: "TASK_COMPLETED",
        message: `Auftrag ${task.id} abgeschlossen, ${deliveredAmount} ${warehouseContainer.quantityUnit} erfasst`,
        userId,
        taskId: task.id,
        containerId: warehouseContainerId,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: { amountAdded: deliveredAmount, unit: warehouseContainer.quantityUnit },
        details: null,
        location: null,
        scanEventId: null
      });
      res.json({
        task: updatedTask,
        targetContainer: {
          id: warehouseContainerId,
          label: warehouseContainerId,
          location: warehouseContainer.location,
          content: warehouseContainer.materialType,
          materialType: warehouseContainer.materialType,
          capacity: warehouseContainer.maxCapacity,
          currentFill: newAmount,
          remainingCapacity: warehouseContainer.maxCapacity - newAmount,
          unit: warehouseContainer.quantityUnit,
          amountAdded: deliveredAmount
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to record delivery" });
    }
  });
  app2.post("/api/tasks/:id/cancel", async (req, res) => {
    try {
      const { userId, reason } = req.body;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      const updatedTask = await storage.updateTaskStatus(req.params.id, "CANCELLED");
      if (!updatedTask) {
        return res.status(400).json({ error: "Invalid status transition - task may already be completed" });
      }
      await storage.updateTask(req.params.id, {
        cancellationReason: reason
      });
      await storage.createActivityLog({
        type: "TASK_CANCELLED",
        action: "TASK_CANCELLED",
        message: `Auftrag ${task.id} wurde storniert: ${reason || "Kein Grund angegeben"}`,
        userId,
        taskId: task.id,
        containerId: task.containerID,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: { reason },
        details: null,
        location: null,
        scanEventId: null
      });
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel task" });
    }
  });
  app2.get("/api/scan-events", async (req, res) => {
    try {
      const { containerId, taskId, userId } = req.query;
      const filters = {};
      if (containerId) filters.containerId = containerId;
      if (taskId) filters.taskId = taskId;
      if (userId) filters.userId = userId;
      const events = await storage.getScanEvents(Object.keys(filters).length > 0 ? filters : void 0);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan events" });
    }
  });
  app2.get("/api/scan-events/:id", async (req, res) => {
    try {
      const event = await storage.getScanEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Scan event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan event" });
    }
  });
  app2.post("/api/scan-events", async (req, res) => {
    try {
      const { containerId, containerType, userId, scanContext, locationType, locationDetails, geoLocation, taskId } = req.body;
      if (!containerId || !containerType || !userId || !scanContext || !locationType) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const scanEvent = await storage.createScanEvent({
        containerId,
        containerType,
        taskId: taskId || null,
        scannedByUserId: userId,
        scannedAt: /* @__PURE__ */ new Date(),
        scanContext,
        locationType,
        locationDetails: locationDetails || null,
        geoLocation: geoLocation || null,
        scanResult: "SUCCESS",
        resultMessage: null,
        extraData: null
      });
      const logType = locationType === "WAREHOUSE" ? "CONTAINER_SCANNED_AT_WAREHOUSE" : "CONTAINER_SCANNED_AT_CUSTOMER";
      await storage.createActivityLog({
        type: logType,
        action: logType,
        message: `Container ${containerId} wurde gescannt (${scanContext})`,
        userId,
        taskId: taskId || null,
        containerId,
        scanEventId: scanEvent.id,
        location: geoLocation || null,
        timestamp: /* @__PURE__ */ new Date(),
        details: null,
        metadata: null
      });
      res.status(201).json(scanEvent);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scan event" });
    }
  });
  app2.get("/api/activity-logs", async (req, res) => {
    try {
      const { userId, containerId, type, taskId, startDate, endDate } = req.query;
      const filters = {};
      if (userId) filters.userId = userId;
      if (containerId) filters.containerId = containerId;
      if (type) filters.type = type;
      if (taskId) filters.taskId = taskId;
      const logs = await storage.getActivityLogs(Object.keys(filters).length > 0 ? filters : void 0);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });
  app2.get("/api/activity-logs/export/csv", async (req, res) => {
    try {
      const { userId, containerId, type, taskId, startDate, endDate } = req.query;
      const filters = {};
      if (userId) filters.userId = userId;
      if (containerId) filters.containerId = containerId;
      if (type) filters.type = type;
      if (taskId) filters.taskId = taskId;
      const logs = await storage.getActivityLogs(Object.keys(filters).length > 0 ? filters : void 0);
      const users2 = await storage.getUsers();
      const getUserName = (id) => {
        if (!id) return "System";
        const user = users2.find((u) => u.id === id);
        return user?.name || "Unknown";
      };
      const csvHeader = "ID,Datum,Uhrzeit,Benutzer,Typ,Nachricht,Container ID,Auftrag ID\n";
      const csvRows = logs.map((log2) => {
        const date = new Date(log2.timestamp);
        const dateStr = date.toLocaleDateString("de-DE");
        const timeStr = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        const userName = getUserName(log2.userId).replace(/,/g, ";");
        const logType = (log2.type || "").replace(/,/g, ";");
        const message = (log2.message || "").replace(/,/g, ";").replace(/\n/g, " ");
        const containerId2 = (log2.containerId || "").replace(/,/g, ";");
        const taskIdVal = (log2.taskId || "").replace(/,/g, ";");
        return `${log2.id},${dateStr},${timeStr},${userName},${logType},${message},${containerId2},${taskIdVal}`;
      }).join("\n");
      const csv = csvHeader + csvRows;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=aktivitaetslog-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send("\uFEFF" + csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export activity logs" });
    }
  });
  app2.get("/api/analytics/driver-performance", async (req, res) => {
    try {
      const allTasks = await storage.getTasks();
      const users2 = await storage.getUsers();
      const drivers = users2.filter((u) => u.role === "driver" || u.role === "DRIVER");
      const now = /* @__PURE__ */ new Date();
      const today = now.toDateString();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const driverStats = drivers.map((driver) => {
        const driverTasks = allTasks.filter((t) => t.assignedTo === driver.id);
        const completedTasks = driverTasks.filter((t) => t.status === "COMPLETED" || t.status === "completed");
        const completedToday = completedTasks.filter((t) => {
          if (!t.completedAt) return false;
          return new Date(t.completedAt).toDateString() === today;
        });
        const completedThisWeek = completedTasks.filter((t) => {
          if (!t.completedAt) return false;
          const completedDate = new Date(t.completedAt);
          return completedDate >= startOfWeek;
        });
        const avgDeliveryTime = completedTasks.length > 0 ? completedTasks.reduce((sum, t) => {
          if (t.acceptedAt && t.completedAt) {
            return sum + (new Date(t.completedAt).getTime() - new Date(t.acceptedAt).getTime());
          }
          return sum;
        }, 0) / completedTasks.length / (1e3 * 60) : 0;
        const completionRate = driverTasks.length > 0 ? Math.round(completedTasks.length / driverTasks.length * 100) : 0;
        const inProgressStatuses = ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "in_progress"];
        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          totalAssigned: driverTasks.length,
          totalCompleted: completedTasks.length,
          completedToday: completedToday.length,
          completedThisWeek: completedThisWeek.length,
          inProgress: driverTasks.filter((t) => inProgressStatuses.includes(t.status)).length,
          completionRate,
          avgDeliveryTimeMinutes: Math.round(avgDeliveryTime)
        };
      });
      const overallStats = {
        totalDrivers: drivers.length,
        activeDrivers: driverStats.filter((d) => d.inProgress > 0 || d.completedToday > 0).length,
        totalCompletedToday: driverStats.reduce((sum, d) => sum + d.completedToday, 0),
        totalCompletedThisWeek: driverStats.reduce((sum, d) => sum + d.completedThisWeek, 0),
        avgCompletionRate: driverStats.length > 0 ? Math.round(driverStats.reduce((sum, d) => sum + d.completionRate, 0) / driverStats.length) : 0
      };
      res.json({
        drivers: driverStats,
        overall: overallStats
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver performance" });
    }
  });
  app2.get("/api/analytics/fill-trends", async (req, res) => {
    try {
      const warehouseContainers2 = await storage.getWarehouseContainers();
      const allTasks = await storage.getTasks();
      const now = /* @__PURE__ */ new Date();
      const daysAgo = (days) => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date;
      };
      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = daysAgo(i);
        const dateStr = date.toLocaleDateString("de-DE", { month: "short", day: "numeric" });
        const dayTasks = allTasks.filter((t) => {
          if (!t.completedAt) return false;
          const taskDate = new Date(t.completedAt);
          return taskDate.toDateString() === date.toDateString();
        });
        const totalDelivered = dayTasks.reduce((sum, t) => {
          const container = warehouseContainers2.find((c) => c.id === t.deliveryContainerID);
          return sum + (container ? 50 : 0);
        }, 0);
        dailyData.push({
          date: dateStr,
          deliveries: dayTasks.length,
          volumeKg: totalDelivered
        });
      }
      const currentFillLevels = warehouseContainers2.map((c) => ({
        id: c.id,
        location: c.location,
        materialType: c.materialType,
        currentAmount: c.currentAmount,
        maxCapacity: c.maxCapacity,
        fillPercentage: Math.round(c.currentAmount / c.maxCapacity * 100)
      }));
      const materialBreakdown = warehouseContainers2.reduce((acc, c) => {
        const existing = acc.find((m) => m.material === c.materialType);
        if (existing) {
          existing.currentAmount += c.currentAmount;
          existing.maxCapacity += c.maxCapacity;
        } else {
          acc.push({
            material: c.materialType,
            currentAmount: c.currentAmount,
            maxCapacity: c.maxCapacity
          });
        }
        return acc;
      }, []);
      res.json({
        dailyTrends: dailyData,
        containerLevels: currentFillLevels,
        materialBreakdown
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const { driverId } = req.query;
      const allTasks = await storage.getTasks();
      const warehouseContainers2 = await storage.getWarehouseContainers();
      const users2 = await storage.getUsers();
      const tasksToCount = driverId ? allTasks.filter((t) => t.assignedTo === driverId) : allTasks;
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = /* @__PURE__ */ new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayTasks = tasksToCount.filter((t) => {
        const created = new Date(t.createdAt);
        return created >= today && created <= todayEnd;
      });
      const openStatuses = ["OFFEN", "PLANNED", "ASSIGNED"];
      const inProgressStatuses = ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
      const completedStatuses = ["COMPLETED"];
      const cancelledStatuses = ["CANCELLED"];
      const openTasks = tasksToCount.filter((t) => openStatuses.includes(t.status)).length;
      const inProgressTasks = tasksToCount.filter((t) => inProgressStatuses.includes(t.status)).length;
      const completedTasks = tasksToCount.filter((t) => completedStatuses.includes(t.status)).length;
      const completedToday = todayTasks.filter((t) => completedStatuses.includes(t.status)).length;
      const cancelledTasks = tasksToCount.filter((t) => cancelledStatuses.includes(t.status)).length;
      const activeDrivers = users2.filter((u) => (u.role === "driver" || u.role === "DRIVER") && u.isActive).length;
      const criticalContainers = warehouseContainers2.filter((c) => {
        const fillPercentage = c.currentAmount / c.maxCapacity * 100;
        return fillPercentage >= 80;
      }).length;
      const totalCapacity = warehouseContainers2.reduce((acc, c) => acc + c.maxCapacity, 0);
      const usedCapacity = warehouseContainers2.reduce((acc, c) => acc + c.currentAmount, 0);
      const availableCapacity = totalCapacity - usedCapacity;
      res.json({
        openTasks,
        inProgressTasks,
        completedTasks,
        completedToday,
        cancelledTasks,
        activeDrivers,
        criticalContainers,
        totalCapacity,
        availableCapacity,
        totalTasks: tasksToCount.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/drivers/:id/stats", async (req, res) => {
    try {
      const driverId = req.params.id;
      const driver = await storage.getUser(driverId);
      if (!driver) {
        return res.status(404).json({ error: "Fahrer nicht gefunden" });
      }
      const allTasks = await storage.getTasks({ assignedTo: driverId });
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = /* @__PURE__ */ new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayTasks = allTasks.filter((t) => {
        const created = new Date(t.createdAt);
        return created >= today && created <= todayEnd;
      });
      const openStatuses = ["OFFEN", "PLANNED", "ASSIGNED"];
      const inProgressStatuses = ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
      const completedStatuses = ["COMPLETED"];
      const cancelledStatuses = ["CANCELLED"];
      const openTasks = allTasks.filter((t) => openStatuses.includes(t.status)).length;
      const inProgressTasks = allTasks.filter((t) => inProgressStatuses.includes(t.status)).length;
      const completedTasks = allTasks.filter((t) => completedStatuses.includes(t.status)).length;
      const completedToday = todayTasks.filter((t) => completedStatuses.includes(t.status)).length;
      const cancelledTasks = allTasks.filter((t) => cancelledStatuses.includes(t.status)).length;
      const activityLogs2 = await storage.getActivityLogs({ userId: driverId });
      const lastActivity = activityLogs2.length > 0 ? activityLogs2[0].timestamp : null;
      res.json({
        driverId,
        driverName: driver.name,
        driverEmail: driver.email,
        openTasks,
        inProgressTasks,
        completedTasks,
        completedToday,
        cancelledTasks,
        totalTasks: allTasks.length,
        lastActivity
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver stats" });
    }
  });
  app2.get("/api/drivers/overview", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const allTasks = await storage.getTasks();
      const drivers = users2.filter((u) => u.role === "DRIVER" || u.role === "driver");
      const openStatuses = ["OFFEN", "PLANNED", "ASSIGNED"];
      const inProgressStatuses = ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
      const completedStatuses = ["COMPLETED"];
      const cancelledStatuses = ["CANCELLED"];
      const driverOverview = await Promise.all(drivers.map(async (driver) => {
        const driverTasks = allTasks.filter((t) => t.assignedTo === driver.id);
        const activityLogs2 = await storage.getActivityLogs({ userId: driver.id });
        const lastActivity = activityLogs2.length > 0 ? activityLogs2[0].timestamp : null;
        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          isActive: driver.isActive,
          openTasks: driverTasks.filter((t) => openStatuses.includes(t.status)).length,
          inProgressTasks: driverTasks.filter((t) => inProgressStatuses.includes(t.status)).length,
          completedTasks: driverTasks.filter((t) => completedStatuses.includes(t.status)).length,
          cancelledTasks: driverTasks.filter((t) => cancelledStatuses.includes(t.status)).length,
          totalTasks: driverTasks.length,
          lastActivity
        };
      }));
      res.json(driverOverview);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver overview" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origin = req.header("origin");
    if (origin) {
      const allowedPatterns = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        /\.replit\.dev$/,
        /\.replit\.app$/,
        /\.riker\.replit\.dev$/,
        /\.repl\.co$/,
        /\.onrender\.com$/
      ];
      const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin)) || process.env.REPLIT_DEV_DOMAIN && origin.includes(process.env.REPLIT_DEV_DOMAIN) || process.env.RENDER_EXTERNAL_URL && origin.includes(process.env.RENDER_EXTERNAL_URL);
      if (isAllowed) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        );
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-replit-user-id, x-replit-user-name, x-replit-user-roles");
        res.header("Access-Control-Allow-Credentials", "true");
      }
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-replit-user-id, x-replit-user-name, x-replit-user-roles");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL || "");
    log(`Using Supabase PostgreSQL via DATABASE_URL (host: ${dbUrl.hostname})`);
  } catch {
    log(`Using Supabase PostgreSQL via DATABASE_URL`);
  }
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
