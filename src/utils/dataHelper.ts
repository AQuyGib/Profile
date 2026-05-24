export interface Zone {
  id: string;
  name: string;
  vietnameseName: string;
  icon: string;
  color: string;
  coords: { x: number; y: number };
  size: { w: number; h: number };
  description_vi: string;
  description_en: string;
  details_vi: any;
  details_en: any;
  description?: string;
  details?: any;
}

/**
 * Helper function that dynamically fetches content based on the active 'zone' ID.
 * Reads the central /data.json file and returns the correct zone schema.
 */
export async function fetchZoneContent(zoneId: string): Promise<Zone | null> {
  try {
    const res = await fetch("/data.json");
    if (!res.ok) {
      throw new Error(`Failed to fetch central data.json: ${res.statusText}`);
    }
    const data = await res.json();
    const zones: Zone[] = data.zones || [];
    return zones.find((z) => z.id === zoneId) || null;
  } catch (error) {
    console.error(`Error in fetchZoneContent for zone: ${zoneId}`, error);
    return null;
  }
}

/**
 * Helper function that dynamically fetches all zones configurations.
 */
export async function fetchAllZones(): Promise<Zone[]> {
  try {
    const res = await fetch("/data.json");
    if (!res.ok) {
      throw new Error(`Failed to fetch central data.json: ${res.statusText}`);
    }
    const data = await res.json();
    return data.zones || [];
  } catch (error) {
    console.error("Error in fetchAllZones", error);
    return [];
  }
}
