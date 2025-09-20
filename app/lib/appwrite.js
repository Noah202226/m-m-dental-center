// lib/appwrite.ts

import { Client, Account, Databases } from "appwrite";

export const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;

export { ID } from "appwrite";
