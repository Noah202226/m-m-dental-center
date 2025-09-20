// hooks/useServices.js
"use client";
import { useEffect, useState } from "react";
import { databases, DATABASE_ID } from "../../lib/appwrite";

const SERVICES_COLLECTION_ID = "services";
const SUB_SERVICES_COLLECTION_ID = "subServices";

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const servicesRes = await databases.listDocuments(
          DATABASE_ID,
          SERVICES_COLLECTION_ID
        );
        const subRes = await databases.listDocuments(
          DATABASE_ID,
          SUB_SERVICES_COLLECTION_ID
        );

        const subByService = {};
        subRes.documents.forEach((sub) => {
          if (!subByService[sub.serviceId]) {
            subByService[sub.serviceId] = [];
          }
          subByService[sub.serviceId].push({
            id: sub.$id,
            name: sub.subServiceName,
          });
        });

        const combined = servicesRes.documents.map((s) => ({
          id: s.$id,
          name: s.serviceName,
          subServices: subByService[s.$id] || [],
        }));

        setServices(combined);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { services, loading };
}
