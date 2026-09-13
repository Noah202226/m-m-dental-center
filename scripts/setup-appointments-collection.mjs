import fs from "fs";
import path from "path";
import { Client, Databases, Permission, Role } from "node-appwrite";

// Helper to parse .env or .env.local if present
const loadEnv = (fileName) => {
  const envPath = path.resolve(process.cwd(), fileName);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...vals] = trimmed.split("=");
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
        }
      }
    });
  }
};

loadEnv(".env.local");
loadEnv(".env");

// --- CONFIGURE TARGET CLINIC APPWRITE CREDENTIALS ---
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY; // Appwrite Console -> API Keys -> Create Key (databases.write scope)
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || process.env.DATABASE_ID;
const COLLECTION_ID = "appointments";

if (!PROJECT_ID || !DATABASE_ID) {
  console.error("❌ Missing required environment variables: NEXT_PUBLIC_APPWRITE_PROJECT_ID and NEXT_PUBLIC_DATABASE_ID.");
  process.exit(1);
}

if (!API_KEY) {
  console.error("\n❌ Error: APPWRITE_API_KEY is required to create collections.");
  console.log("Please create an API key in your Appwrite Console with database scopes,");
  console.log("then add APPWRITE_API_KEY=your_key to your .env or .env.local file or pass via environment variable.\n");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// Appwrite processes attributes asynchronously; buffer with a short delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup() {
  console.log("🚀 Provisioning Appointments Collection on Appwrite...");
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Project:  ${PROJECT_ID}`);
  console.log(`Database: ${DATABASE_ID}`);

  // 1. Create Collection with Any (public/client) permissions
  try {
    console.log(`Creating collection "${COLLECTION_ID}"...`);
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      "Appointments",
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false
    );
    console.log("✅ Collection created successfully.");
  } catch (error) {
    if (error.code === 409) {
      console.log("ℹ️ Collection already exists. Proceeding to verify/add attributes...");
    } else {
      console.error("❌ Failed to create collection:", error.message);
      process.exit(1);
    }
  }

  // Helpers
  const addString = async (key, size = 255, required = false, xdefault = null, array = false) => {
    try {
      console.log(`Adding string attribute: ${key}...`);
      await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, size, required, xdefault, array);
      await sleep(1000);
    } catch (e) {
      if (e.code === 409) console.log(`  ↪ ${key} already exists.`);
      else console.warn(`  ⚠️ Error adding ${key}:`, e.message);
    }
  };

  const addBool = async (key, required = false, xdefault = false) => {
    try {
      console.log(`Adding boolean attribute: ${key}...`);
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, key, required, xdefault);
      await sleep(1000);
    } catch (e) {
      if (e.code === 409) console.log(`  ↪ ${key} already exists.`);
      else console.warn(`  ⚠️ Error adding ${key}:`, e.message);
    }
  };

  const addDatetime = async (key, required = false, xdefault = null) => {
    try {
      console.log(`Adding datetime attribute: ${key}...`);
      await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, key, required, xdefault);
      await sleep(1000);
    } catch (e) {
      if (e.code === 409) console.log(`  ↪ ${key} already exists.`);
      else console.warn(`  ⚠️ Error adding ${key}:`, e.message);
    }
  };

  // 2. Add All Document Attributes
  console.log("\n📦 Creating attributes...");

  // Identification & Patient Name
  await addString("title", 255, false, "");
  await addString("firstName", 150, false, "");
  await addString("middleName", 150, false, "");
  await addString("lastName", 150, false, "");
  await addString("email", 255, false, "");
  await addString("phone", 50, false, "");

  // Demographics
  await addString("birthdate", 50, false, "");
  await addString("gender", 30, false, "");
  await addString("civilStatus", 50, false, "");
  await addString("occupation", 150, false, "");
  await addString("address", 500, false, "");

  // Schedule Info
  await addDatetime("date", false);
  await addString("dateKey", 20, false, "");
  await addString("time", 30, false, "");

  // Status & Clinical Assignment
  await addString("status", 50, false, "pending");
  await addString("attendanceStatus", 50, false, "scheduled");
  await addString("assignedDentist", 150, false, "");

  // Notes & Referrals
  await addString("notes", 2000, false, "");
  await addString("adminNote", 2000, false, "");
  await addString("referralSource", 150, false, "");

  // Emergency & Medical History
  await addString("emergencyToContact", 150, false, "");
  await addString("emergencyToContactNumber", 50, false, "");
  await addString("medicalHistory", 255, false, null, true); // String array

  // Linkages & Flags
  await addString("patientId", 100, false, "");
  await addString("photoFileId", 100, false, "");
  await addBool("isNewPatient", false, true);
  await addString("timestamp", 100, false, "");

  // 3. Create Optimization Indexes
  console.log("\n⚡ Creating Indexes...");
  await sleep(3000);

  const createIdx = async (key, type, attributes) => {
    try {
      await databases.createIndex(DATABASE_ID, COLLECTION_ID, key, type, attributes);
      console.log(`✅ Index "${key}" created.`);
      await sleep(1000);
    } catch (e) {
      if (e.code === 409) console.log(`ℹ️ Index "${key}" already exists.`);
      else console.warn(`⚠️ Index error "${key}":`, e.message);
    }
  };

  await createIdx("idx_dateKey", "key", ["dateKey"]);
  await createIdx("idx_status", "key", ["status"]);

  console.log("\n🎉 Appointments collection is fully configured and ready to use!");
}

setup();
