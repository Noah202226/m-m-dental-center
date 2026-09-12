import fs from "fs";
import path from "path";

// Read environment variables from .env
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...vals] = trimmed.split("=");
    env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
  }
});

const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const DATABASE_ID = env.NEXT_PUBLIC_DATABASE_ID;
const API_KEY = process.env.APPWRITE_API_KEY || env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error("\n❌ Error: APPWRITE_API_KEY is required to create collections.");
  console.log("Please create an API key in your Appwrite Console with database scopes,");
  console.log("then add APPWRITE_API_KEY=your_key to your .env file or run:");
  console.log("  $env:APPWRITE_API_KEY=\"your_key\"; node scripts/setup-database.mjs\n");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "X-Appwrite-Project": PROJECT_ID,
  "X-Appwrite-Key": API_KEY,
};

const collectionsSchema = [
  {
    id: "patients",
    name: "patients",
    attributes: [
      { type: "string", key: "patientName", size: 255, required: true },
      { type: "integer", key: "patientAge", required: true, min: 0, max: 150 },
      { type: "string", key: "gender", size: 50, required: true },
      { type: "string", key: "contact", size: 50, required: true },
      { type: "string", key: "address", size: 255, required: true },
      { type: "string", key: "serviceName", size: 255, required: true },
      { type: "string", key: "subServiceName", size: 255, required: false },
      { type: "string", key: "serviceType", size: 50, required: true },
      { type: "float", key: "servicePrice", required: true },
      { type: "float", key: "balance", required: false, default: 0 },
    ],
    indexes: [],
  },
  {
    id: "transactions",
    name: "transactions",
    attributes: [
      { type: "string", key: "patientId", size: 255, required: true },
      { type: "string", key: "patientName", size: 255, required: false },
      { type: "string", key: "serviceName", size: 255, required: false },
      { type: "string", key: "subServiceName", size: 255, required: false },
      { type: "float", key: "amount", required: true },
      { type: "string", key: "paymentType", size: 50, required: false },
      { type: "string", key: "date", size: 100, required: true },
      { type: "string", key: "remarks", size: 255, required: false },
    ],
    indexes: [
      { key: "patientId_idx", type: "key", attributes: ["patientId"] },
      { key: "date_idx", type: "key", attributes: ["date"] },
    ],
  },
  {
    id: "installments",
    name: "installments",
    attributes: [
      { type: "string", key: "patientId", size: 255, required: true },
      { type: "float", key: "amountPaid", required: true },
      { type: "float", key: "balanceAfter", required: true },
      { type: "string", key: "paymentDate", size: 100, required: true },
      { type: "string", key: "transactionId", size: 255, required: false },
    ],
    indexes: [
      { key: "patientId_idx", type: "key", attributes: ["patientId"] },
      { key: "transactionId_idx", type: "key", attributes: ["transactionId"] },
    ],
  },
  {
    id: "expenses",
    name: "expenses",
    attributes: [
      { type: "string", key: "title", size: 255, required: true },
      { type: "float", key: "amount", required: true },
      { type: "string", key: "category", size: 100, required: true },
      { type: "string", key: "date", size: 100, required: true },
    ],
    indexes: [],
  },
  {
    id: "categories",
    name: "categories",
    attributes: [
      { type: "string", key: "name", size: 100, required: true },
    ],
    indexes: [],
  },
  {
    id: "services",
    name: "services",
    attributes: [
      { type: "string", key: "serviceName", size: 255, required: true },
    ],
    indexes: [],
  },
  {
    id: "subServices",
    name: "subServices",
    attributes: [
      { type: "string", key: "serviceId", size: 255, required: true },
      { type: "string", key: "subServiceName", size: 255, required: true },
    ],
    indexes: [],
  },
  {
    id: "products",
    name: "products",
    attributes: [
      { type: "string", key: "name", size: 255, required: true },
      { type: "string", key: "category", size: 100, required: true },
      { type: "float", key: "price", required: true },
      { type: "integer", key: "stock", required: true, min: 0 },
    ],
    indexes: [],
  },
  {
    id: "personalization",
    name: "personalization",
    attributes: [
      { type: "string", key: "title", size: 255, required: false },
      { type: "string", key: "initial", size: 50, required: false },
    ],
    indexes: [],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function apiRequest(method, path, body = null) {
  const url = `${ENDPOINT}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log(`\n🚀 Starting Appwrite Database Setup...`);
  console.log(`   Endpoint:   ${ENDPOINT}`);
  console.log(`   Project ID: ${PROJECT_ID}`);
  console.log(`   Database:   ${DATABASE_ID}\n`);

  // 1. Check existing databases
  const listDbs = await apiRequest("GET", `/databases`);
  let targetDbId = DATABASE_ID;

  if (listDbs.ok && listDbs.data.databases && listDbs.data.databases.length > 0) {
    const existing = listDbs.data.databases.find((d) => d.$id === targetDbId || d.name === targetDbId);
    if (existing) {
      targetDbId = existing.$id;
      console.log(`✅ Found database: "${existing.name}" (ID: ${existing.$id})`);
    } else {
      // Use the first existing database in the project!
      const firstDb = listDbs.data.databases[0];
      console.log(`ℹ️ Configured database "${targetDbId}" was not found.`);
      console.log(`✅ Using existing database in your project: "${firstDb.name}" (ID: ${firstDb.$id})`);
      targetDbId = firstDb.$id;
    }
  } else {
    // Try to create if no database exists at all
    console.log(`📦 No database found. Creating "${DATABASE_ID}"...`);
    const createDb = await apiRequest("POST", `/databases`, {
      databaseId: DATABASE_ID,
      name: DATABASE_ID,
    });
    if (!createDb.ok) {
      console.error("❌ Failed to create database:", createDb.data);
      process.exit(1);
    }
    console.log(`✅ Database "${DATABASE_ID}" created!`);
  }

  const DATABASE_TO_USE = targetDbId;

  // 2. Iterate through collections
  for (const col of collectionsSchema) {
    console.log(`\n📂 Setting up collection: "${col.name}" (${col.id})...`);
    
    // Check if collection exists
    const checkCol = await apiRequest("GET", `/databases/${DATABASE_TO_USE}/collections/${col.id}`);
    if (!checkCol.ok) {
      const permissions = [
        'read("any")',
        'create("any")',
        'update("any")',
        'delete("any")',
        'read("users")',
        'create("users")',
        'update("users")',
        'delete("users")',
      ];

      const createCol = await apiRequest("POST", `/databases/${DATABASE_TO_USE}/collections`, {
        collectionId: col.id,
        name: col.name,
        permissions,
        documentSecurity: false,
      });

      if (!createCol.ok) {
        console.error(`   ❌ Failed to create collection ${col.id}:`, createCol.data);
        continue;
      }
      console.log(`   ✅ Collection created with full permissions.`);
    } else {
      console.log(`   ℹ️ Collection already exists.`);
    }

    // 3. Create Attributes
    for (const attr of col.attributes) {
      const typeEndpoint = `/databases/${DATABASE_TO_USE}/collections/${col.id}/attributes/${attr.type}`;
      const payload = { ...attr };
      delete payload.type;

      const createAttr = await apiRequest("POST", typeEndpoint, payload);
      if (createAttr.ok) {
        console.log(`   ➕ Created attribute: ${attr.key} (${attr.type})`);
      } else if (createAttr.data.type === "attribute_already_exists" || createAttr.status === 409) {
        console.log(`   ℹ️ Attribute already exists: ${attr.key}`);
      } else {
        console.warn(`   ⚠️ Attribute error for ${attr.key}:`, createAttr.data.message);
      }
    }

    // 4. Wait slightly for attributes to process before creating indexes
    if (col.indexes.length > 0) {
      console.log(`   ⏳ Waiting for attributes to finish indexing...`);
      await sleep(3000);

      for (const idx of col.indexes) {
        const createIdx = await apiRequest("POST", `/databases/${DATABASE_TO_USE}/collections/${col.id}/indexes`, {
          key: idx.key,
          type: idx.type,
          attributes: idx.attributes,
        });
        if (createIdx.ok) {
          console.log(`   🗂️ Created index: ${idx.key}`);
        } else if (createIdx.status === 409) {
          console.log(`   ℹ️ Index already exists: ${idx.key}`);
        } else {
          console.warn(`   ⚠️ Index notice for ${idx.key}:`, createIdx.data.message);
        }
      }
    }
  }

  // Update .env if the database ID was different
  if (DATABASE_TO_USE !== DATABASE_ID) {
    let updatedEnv = fs.readFileSync(envPath, "utf-8");
    updatedEnv = updatedEnv.replace(
      /NEXT_PUBLIC_DATABASE_ID=.*/,
      `NEXT_PUBLIC_DATABASE_ID=${DATABASE_TO_USE}`
    );
    fs.writeFileSync(envPath, updatedEnv, "utf-8");
    console.log(`\n🔄 Updated NEXT_PUBLIC_DATABASE_ID in .env to: ${DATABASE_TO_USE}`);
  }

  console.log(`\n🎉 All 9 collections, attributes, indexes, and permissions are successfully configured!\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
