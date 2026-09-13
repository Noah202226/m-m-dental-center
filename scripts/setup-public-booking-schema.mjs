import fs from "fs";
import path from "path";
import { Client, Databases, Storage, Permission, Role, ID, Query } from "node-appwrite";

// Helper to parse .env or .env.local
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

// --- CONFIGURE APPWRITE CREDENTIALS ---
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || "m-m-data";
const API_KEY = process.env.APPWRITE_API_KEY;
const BUCKET_ID = process.env.NEXT_PUBLIC_STORAGE_BUCKET_ID || "profile-image-bucket";

if (!PROJECT_ID || !DATABASE_ID) {
  console.error("❌ Missing required environment variables: NEXT_PUBLIC_APPWRITE_PROJECT_ID and NEXT_PUBLIC_DATABASE_ID.");
  process.exit(1);
}

if (!API_KEY) {
  console.error("\n❌ Error: APPWRITE_API_KEY is required to create collections and attributes.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createCollectionSafe(id, name, permissions) {
  try {
    console.log(`📦 Creating collection "${id}" (${name})...`);
    await databases.createCollection(DATABASE_ID, id, name, permissions, false);
    console.log(`  ✅ Collection "${id}" created.`);
    await sleep(1000);
  } catch (err) {
    if (err.code === 409) {
      console.log(`  ℹ️ Collection "${id}" already exists. Updating permissions...`);
      try {
        await databases.updateCollection(DATABASE_ID, id, name, permissions, false);
        console.log(`  ✅ Collection "${id}" permissions updated.`);
        await sleep(600);
      } catch (e) {
        console.warn(`  ⚠️ Could not update permissions on ${id}:`, e.message);
      }
    } else {
      console.error(`❌ Failed to create collection ${id}:`, err.message);
    }
  }
}

async function addString(col, key, size = 255, req = false, xdef = null, array = false) {
  try {
    await databases.createStringAttribute(DATABASE_ID, col, key, size, req, xdef, array);
    console.log(`  + [string] ${col}.${key}`);
    await sleep(800);
  } catch (e) {
    if (e.code === 409) console.log(`  ✓ ${col}.${key} exists.`);
    else console.warn(`  ⚠️ ${col}.${key}: ${e.message}`);
  }
}

async function addBool(col, key, req = false, xdef = false) {
  try {
    await databases.createBooleanAttribute(DATABASE_ID, col, key, req, xdef);
    console.log(`  + [boolean] ${col}.${key}`);
    await sleep(800);
  } catch (e) {
    if (e.code === 409) console.log(`  ✓ ${col}.${key} exists.`);
    else console.warn(`  ⚠️ ${col}.${key}: ${e.message}`);
  }
}

async function addInt(col, key, req = false, min = null, max = null, xdef = null) {
  try {
    await databases.createIntegerAttribute(DATABASE_ID, col, key, req, min, max, xdef);
    console.log(`  + [integer] ${col}.${key}`);
    await sleep(800);
  } catch (e) {
    if (e.code === 409) console.log(`  ✓ ${col}.${key} exists.`);
    else console.warn(`  ⚠️ ${col}.${key}: ${e.message}`);
  }
}

async function addFloat(col, key, req = false, min = null, max = null, xdef = null) {
  try {
    await databases.createFloatAttribute(DATABASE_ID, col, key, req, min, max, xdef);
    console.log(`  + [float] ${col}.${key}`);
    await sleep(800);
  } catch (e) {
    if (e.code === 409) console.log(`  ✓ ${col}.${key} exists.`);
    else console.warn(`  ⚠️ ${col}.${key}: ${e.message}`);
  }
}

async function addDatetime(col, key, req = false, xdef = null) {
  try {
    await databases.createDatetimeAttribute(DATABASE_ID, col, key, req, xdef);
    console.log(`  + [datetime] ${col}.${key}`);
    await sleep(800);
  } catch (e) {
    if (e.code === 409) console.log(`  ✓ ${col}.${key} exists.`);
    else console.warn(`  ⚠️ ${col}.${key}: ${e.message}`);
  }
}

async function createIndexSafe(col, key, type, attrs) {
  try {
    await databases.createIndex(DATABASE_ID, col, key, type, attrs);
    console.log(`  ✅ Index "${key}" on "${col}" created.`);
    await sleep(1000);
  } catch (e) {
    if (e.code === 409) console.log(`  ✓ Index ${key} exists.`);
    else console.warn(`  ⚠️ Index ${key}: ${e.message}`);
  }
}

async function setupBucketSafe() {
  try {
    console.log(`\n🪣 Checking storage bucket "${BUCKET_ID}"...`);
    await storage.getBucket(BUCKET_ID);
    console.log(`  ℹ️ Bucket "${BUCKET_ID}" already exists.`);
  } catch (err) {
    if (err.code === 404) {
      console.log(`  Creating storage bucket "${BUCKET_ID}"...`);
      try {
        await storage.createBucket(
          BUCKET_ID,
          "Profile Image Bucket",
          [
            Permission.read(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
          ],
          false,
          true,
          30000000, // 30MB max file size
          ["jpg", "jpeg", "png", "webp", "pdf"]
        );
        console.log(`  ✅ Storage bucket "${BUCKET_ID}" created successfully.`);
      } catch (createErr) {
        console.warn(`  ⚠️ Failed to create bucket:`, createErr.message);
      }
    } else {
      console.warn(`  ⚠️ Storage check:`, err.message);
    }
  }
}

async function seedDataIfEmpty() {
  console.log("\n🌱 Checking & Seeding Default Data for Public Booking...");

  const docPermissions = [
    Permission.read(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  // 1. Seed clinic_schedules
  try {
    const existing = await databases.listDocuments(DATABASE_ID, "clinic_schedules", [Query.limit(1)]);
    if (existing.total === 0) {
      console.log("  Seeding default active schedule in clinic_schedules...");
      const regularConfig = {
        Monday:    { open: "09:00", close: "17:00", active: true,  capacity: 3 },
        Tuesday:   { open: "09:00", close: "17:00", active: true,  capacity: 3 },
        Wednesday: { open: "09:00", close: "17:00", active: true,  capacity: 3 },
        Thursday:  { open: "09:00", close: "17:00", active: true,  capacity: 3 },
        Friday:    { open: "09:00", close: "17:00", active: true,  capacity: 3 },
        Saturday:  { open: "09:00", close: "16:00", active: true,  capacity: 2 },
        Sunday:    { open: "00:00", close: "00:00", active: false, capacity: 0 }
      };

      await databases.createDocument(
        DATABASE_ID,
        "clinic_schedules",
        ID.unique(),
        {
          name: "Regular Operating Hours",
          startDate: new Date("2025-01-01T00:00:00.000Z").toISOString(),
          endDate: new Date("2030-12-31T23:59:59.999Z").toISOString(),
          priority: 10,
          config: JSON.stringify(regularConfig)
        },
        docPermissions
      );
      console.log("  ✅ Default schedule created covering 2025 - 2030!");
    } else {
      console.log("  ℹ️ clinic_schedules already has schedules configured.");
    }
  } catch (e) {
    console.warn("  ⚠️ Error checking clinic_schedules:", e.message);
  }

  // 2. Seed dentists if empty
  try {
    const existingDentists = await databases.listDocuments(DATABASE_ID, "dentists", [Query.limit(1)]);
    if (existingDentists.total === 0) {
      console.log("  Seeding default dentists in dentists collection...");
      const sampleDentists = [
        { name: "Dr. Mark Santos, DMD", isActive: true },
        { name: "Dr. Maria Santos, DMD", isActive: true },
      ];
      for (const d of sampleDentists) {
        await databases.createDocument(
          DATABASE_ID,
          "dentists",
          ID.unique(),
          d,
          docPermissions
        );
      }
      console.log("  ✅ Sample dentists seeded.");
    } else {
      console.log("  ℹ️ dentists collection already has doctors registered.");
    }
  } catch (e) {
    console.warn("  ⚠️ Error checking dentists:", e.message);
  }

  // 3. Seed services if empty
  try {
    const existingServices = await databases.listDocuments(DATABASE_ID, "services", [Query.limit(1)]);
    if (existingServices.total === 0) {
      console.log("  Seeding default dental treatments in services collection...");
      const sampleServices = [
        { serviceName: "Comprehensive Consultation & Checkup", serviceDescription: "Oral examination, treatment planning, and dental guidance.", servicePrice: 500 },
        { serviceName: "Oral Prophylaxis (Deep Teeth Cleaning)", serviceDescription: "Removal of plaque and tartar deposits for healthier gums.", servicePrice: 1200 },
        { serviceName: "Tooth Extraction", serviceDescription: "Safe and painless tooth removal with local anesthesia.", servicePrice: 1500 },
        { serviceName: "Composite Filling (Pasta)", serviceDescription: "Tooth-colored aesthetic restoration for cavities or chips.", servicePrice: 1000 },
        { serviceName: "Orthodontic Braces Consultation", serviceDescription: "Dental alignment evaluation and brace installation plan.", servicePrice: 1000 },
        { serviceName: "Teeth Whitening", serviceDescription: "Professional in-office whitening for a brighter smile.", servicePrice: 4500 },
      ];
      for (const s of sampleServices) {
        await databases.createDocument(
          DATABASE_ID,
          "services",
          ID.unique(),
          s,
          docPermissions
        );
      }
      console.log("  ✅ Sample dental treatments seeded.");
    } else {
      console.log("  ℹ️ services collection already has procedures registered.");
    }
  } catch (e) {
    console.warn("  ⚠️ Error checking services:", e.message);
  }

  // 4. Seed personalization if empty
  try {
    const existingPersonalization = await databases.listDocuments(DATABASE_ID, "personalization", [Query.limit(1)]);
    if (existingPersonalization.total === 0) {
      console.log("  Seeding clinic identity in personalization collection...");
      await databases.createDocument(
        DATABASE_ID,
        "personalization",
        ID.unique(),
        {
          businessName: "M&M Dental Center",
          initial: "MMDC",
          accentColor: "gold",
          fontFamily: "Sans",
          phone: "0917-123-4567",
          email: "mmdentalcenter@gmail.com",
          address: "Quezon City, Metro Manila, Philippines"
        },
        docPermissions
      );
      console.log("  ✅ Clinic branding seeded in personalization collection.");
    } else {
      console.log("  ℹ️ personalization collection already configured.");
    }
  } catch (e) {
    console.warn("  ⚠️ Error checking personalization:", e.message);
  }
}

async function main() {
  console.log("🚀 Starting Dental Public Booking Schema Provisioning...\n");
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Project:  ${PROJECT_ID}`);
  console.log(`Database: ${DATABASE_ID}`);

  const publicReadPermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  const publicReadWritePermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  // 1. clinic_schedules
  console.log("\n--- 1. Setting up clinic_schedules ---");
  await createCollectionSafe("clinic_schedules", "Clinic Schedules", publicReadPermissions);
  await addString("clinic_schedules", "name", 150, true);
  await addDatetime("clinic_schedules", "startDate", true);
  await addDatetime("clinic_schedules", "endDate", true);
  await addInt("clinic_schedules", "priority", false, 0, 1000, 10);
  await addString("clinic_schedules", "config", 5000, true);

  // 2. appointments
  console.log("\n--- 2. Setting up appointments ---");
  await createCollectionSafe("appointments", "Appointments", publicReadWritePermissions);
  await addString("appointments", "title", 255, false, "");
  await addString("appointments", "firstName", 150, false, "");
  await addString("appointments", "middleName", 150, false, "");
  await addString("appointments", "lastName", 150, false, "");
  await addString("appointments", "email", 255, false, "");
  await addString("appointments", "phone", 50, false, "");
  await addString("appointments", "birthdate", 50, false, "");
  await addString("appointments", "gender", 30, false, "");
  await addString("appointments", "civilStatus", 50, false, "");
  await addString("appointments", "occupation", 150, false, "");
  await addString("appointments", "address", 500, false, "");
  await addDatetime("appointments", "date", false);
  await addString("appointments", "dateKey", 20, false, "");
  await addString("appointments", "time", 30, false, "");
  await addString("appointments", "status", 50, false, "pending");
  await addString("appointments", "attendanceStatus", 50, false, "scheduled");
  await addString("appointments", "assignedDentist", 150, false, "");
  await addString("appointments", "notes", 2000, false, "");
  await addString("appointments", "adminNote", 2000, false, "");
  await addString("appointments", "referralSource", 150, false, "");
  await addString("appointments", "emergencyToContact", 150, false, "");
  await addString("appointments", "emergencyToContactNumber", 50, false, "");
  await addString("appointments", "medicalHistory", 255, false, null, true); // String array
  await addString("appointments", "patientId", 100, false, "");
  await addString("appointments", "photoFileId", 100, false, "");
  await addBool("appointments", "isNewPatient", false, true);
  await addString("appointments", "timestamp", 100, false, "");

  // 3. services
  console.log("\n--- 3. Setting up services ---");
  await createCollectionSafe("services", "Services", publicReadPermissions);
  await addString("services", "serviceName", 255, true);
  await addString("services", "serviceDescription", 1000, false, "");
  await addFloat("services", "servicePrice", false, 0, null, 0);

  // 4. dentists
  console.log("\n--- 4. Setting up dentists ---");
  await createCollectionSafe("dentists", "Dentists", publicReadPermissions);
  await addString("dentists", "name", 150, true);
  await addBool("dentists", "isActive", false, true);

  // 5. personalization
  console.log("\n--- 5. Setting up personalization ---");
  await createCollectionSafe("personalization", "Personalization", publicReadPermissions);
  await addString("personalization", "businessName", 255, false, "");
  await addString("personalization", "initial", 50, false, "");
  await addString("personalization", "accentColor", 50, false, "gold");
  await addString("personalization", "fontFamily", 50, false, "Sans");
  await addString("personalization", "phone", 100, false, "");
  await addString("personalization", "email", 255, false, "");
  await addString("personalization", "address", 500, false, "");

  // 6. Storage Bucket
  await setupBucketSafe();

  // 7. Indexes
  console.log("\n⚡ Creating Indexes...");
  await sleep(2000);
  await createIndexSafe("appointments", "idx_dateKey", "key", ["dateKey"]);
  await createIndexSafe("appointments", "idx_status", "key", ["status"]);

  // 8. Seed Default Operating Hours, Services, Dentists & Branding
  await seedDataIfEmpty();

  console.log("\n🎉 All 5 collections, attributes, indexes, bucket, and seed data configured successfully!");
}

main().catch(console.error);
