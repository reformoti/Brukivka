import {sqliteTable,text,integer,primaryKey,uniqueIndex} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const accounts=sqliteTable('accounts',{user_id:text('user_id').primaryKey(),username:text('username').notNull(),created_at:integer('created_at').notNull()},t=>[uniqueIndex('accounts_username_unique').on(sql`lower(${t.username})`)]);
export const saves=sqliteTable('saves',{user_id:text('user_id').primaryKey().references(()=>accounts.user_id),revision:integer('revision').notNull(),payload:text('payload').notNull(),object_key:text('object_key'),checksum:text('checksum').notNull(),updated_at:integer('updated_at').notNull()});
export const history=sqliteTable('save_history',{user_id:text('user_id').notNull().references(()=>accounts.user_id),revision:integer('revision').notNull(),payload:text('payload').notNull(),object_key:text('object_key'),checksum:text('checksum').notNull(),updated_at:integer('updated_at').notNull()},t=>[primaryKey({columns:[t.user_id,t.revision]})]);

export const tickets=sqliteTable('homow_tickets',{hash:text('hash').primaryKey(),user_id:text('user_id').notNull(),username:text('username').notNull(),audience:text('audience').notNull(),expires_at:integer('expires_at').notNull()});

export const appleSaves=sqliteTable('appleiq_saves',{user_id:text('user_id').primaryKey().references(()=>accounts.user_id),revision:integer('revision').notNull(),payload:text('payload').notNull(),object_key:text('object_key'),checksum:text('checksum').notNull(),updated_at:integer('updated_at').notNull()});
export const appleHistory=sqliteTable('appleiq_save_history',{user_id:text('user_id').notNull().references(()=>accounts.user_id),revision:integer('revision').notNull(),payload:text('payload').notNull(),object_key:text('object_key'),checksum:text('checksum').notNull(),updated_at:integer('updated_at').notNull()},t=>[primaryKey({columns:[t.user_id,t.revision]})]);

export const credentials=sqliteTable('xar_credentials',{user_id:text('user_id').primaryKey().references(()=>accounts.user_id),gmail:text('gmail').notNull(),salt:text('salt').notNull(),password_hash:text('password_hash').notNull(),algorithm:text('algorithm').notNull(),created_at:integer('created_at').notNull(),updated_at:integer('updated_at').notNull()},t=>[uniqueIndex('xar_credentials_gmail_unique').on(t.gmail)]);
export const sessions=sqliteTable('xar_sessions',{token_hash:text('token_hash').primaryKey(),user_id:text('user_id').notNull().references(()=>accounts.user_id),created_at:integer('created_at').notNull(),expires_at:integer('expires_at').notNull()});
export const authAttempts=sqliteTable('xar_auth_attempts',{key_hash:text('key_hash').primaryKey(),window_start:integer('window_start').notNull(),hits:integer('hits').notNull()});

export const resetTokens=sqliteTable('xar_reset_tokens',{token_hash:text('token_hash').primaryKey(),user_id:text('user_id').notNull().references(()=>accounts.user_id),credential_version:integer('credential_version').notNull(),expires_at:integer('expires_at').notNull(),created_at:integer('created_at').notNull(),consumed_at:integer('consumed_at')});
