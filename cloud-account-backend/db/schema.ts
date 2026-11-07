import {sqliteTable,text,integer,primaryKey,uniqueIndex} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const accounts=sqliteTable('accounts',{user_id:text('user_id').primaryKey(),username:text('username').notNull(),created_at:integer('created_at').notNull()},t=>[uniqueIndex('accounts_username_unique').on(sql`lower(${t.username})`)]);
export const saves=sqliteTable('saves',{user_id:text('user_id').primaryKey().references(()=>accounts.user_id),revision:integer('revision').notNull(),payload:text('payload').notNull(),object_key:text('object_key'),checksum:text('checksum').notNull(),updated_at:integer('updated_at').notNull()});
export const history=sqliteTable('save_history',{user_id:text('user_id').notNull().references(()=>accounts.user_id),revision:integer('revision').notNull(),payload:text('payload').notNull(),object_key:text('object_key'),checksum:text('checksum').notNull(),updated_at:integer('updated_at').notNull()},t=>[primaryKey({columns:[t.user_id,t.revision]})]);

export const tickets=sqliteTable('homow_tickets',{hash:text('hash').primaryKey(),user_id:text('user_id').notNull(),username:text('username').notNull(),audience:text('audience').notNull(),expires_at:integer('expires_at').notNull()});
