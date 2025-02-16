import { pgTable, text, timestamp, foreignKey, serial, boolean, integer, json, primaryKey, unique } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: text("id").primaryKey().notNull(),
	name: text("name"),
	email: text("email").notNull(),
	email_verified: timestamp("email_verified", { mode: 'string' }),
	image: text("image"),
});

export const passwords = pgTable("passwords", {
	user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	password: text("password").notNull(),
});

export const sessions = pgTable("sessions", {
	session_token: text("session_token").primaryKey().notNull(),
	user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	expires: timestamp("expires", { mode: 'string' }).notNull(),
});

export const notifications = pgTable("notifications", {
	id: serial("id").primaryKey().notNull(),
	notif_text: text("notif_text").notNull(),
	notif_desc: text("notif_desc"),
	notif_owner: text("notif_owner").references(() => users.id),
	timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const capsules = pgTable("capsules", {
	id: serial("id").primaryKey().notNull(),
	albums: text("albums").array(),
	unlock_time: timestamp("unlock_time", { withTimezone: true, mode: 'string' }),
	reminders: boolean("reminders").default(false),
	reminderfreq: text("reminderfreq"),
	theme: text("theme"),
	passwordtoggle: boolean("passwordtoggle").default(false),
	password: text("password"),
});

export const images = pgTable("images", {
	id: serial("id").primaryKey().notNull(),
	public_id: text("public_id"),
	public_url: text("public_url"),
	owner: text("owner").references(() => users.id),
});

export const album_images = pgTable("album_images", {
	id: serial("id").primaryKey().notNull(),
	album_id: integer("album_id").notNull(),
	image_url: text("image_url").notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const albums = pgTable("albums", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	images: text("images").default('RRAY[').array(),
	collab: json("collab"),
	mainowner: text("mainowner"),
});

export const verification_tokens = pgTable("verification_tokens", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		verification_tokens_identifier_token_pk: primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_identifier_token_pk"}),
	}
});

export const authenticators = pgTable("authenticators", {
	credential_id: text("credential_id").notNull(),
	user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	provider_account_id: text("provider_account_id").notNull(),
	credential_public_key: text("credential_public_key").notNull(),
	counter: integer("counter").notNull(),
	credential_device_type: text("credential_device_type").notNull(),
	credential_backed_up: boolean("credential_backed_up").notNull(),
	transports: text("transports"),
},
(table) => {
	return {
		authenticators_user_id_credential_id_pk: primaryKey({ columns: [table.credential_id, table.user_id], name: "authenticators_user_id_credential_id_pk"}),
		authenticators_credential_id_unique: unique("authenticators_credential_id_unique").on(table.credential_id),
	}
});

export const accounts = pgTable("accounts", {
	user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	provider_account_id: text("provider_account_id").notNull(),
	refresh_token: text("refresh_token"),
	access_token: text("access_token"),
	expires_at: integer("expires_at"),
	token_type: text("token_type"),
	scope: text("scope"),
	id_token: text("id_token"),
	session_state: text("session_state"),
},
(table) => {
	return {
		accounts_provider_provider_account_id_pk: primaryKey({ columns: [table.provider, table.provider_account_id], name: "accounts_provider_provider_account_id_pk"}),
	}
});