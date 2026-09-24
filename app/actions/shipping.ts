"use server";

export async function getProvinces() {
  try {
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    const type = process.env.RAJAONGKIR_TYPE || 'starter';
    const baseUrl = type === 'pro' ? 'https://pro.rajaongkir.com/api' : 'https://rajaongkir.komerce.id/api/v1/destination';

    const response = await fetch(`${baseUrl}/province`, {
      method: "GET",
      headers: {
        key: apiKey || "",
        accept: 'application/json'
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
      console.error("Failed to fetch provinces from RajaOngkir", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }
}

export async function getCities(provinceId: string) {
  try {
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    const type = process.env.RAJAONGKIR_TYPE || 'starter';
    const baseUrl = type === 'pro' ? 'https://pro.rajaongkir.com/api' : 'https://rajaongkir.komerce.id/api/v1/destination';

    const isPro = type === 'pro';
    const url = isPro ? `${baseUrl}/city?province=${provinceId}` : `${baseUrl}/city/${provinceId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        key: apiKey || "",
        accept: 'application/json'
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
      console.error("Failed to fetch cities from RajaOngkir");
      return [];
    }

    const data = await response.json();
    return isPro ? data.rajaongkir.results : data.data;
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
}

export async function calculateShippingCost(originCityId: string, destinationCityId: string, weightGrams: number, courier: string) {
  try {
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    const type = process.env.RAJAONGKIR_TYPE || 'starter';
    const baseUrl = type === 'pro' ? 'https://pro.rajaongkir.com/api' : 'https://rajaongkir.komerce.id/api/v1/calculate';

    const isPro = type === 'pro';
    const url = isPro ? `${baseUrl}/cost` : `${baseUrl}/domestic-cost`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        key: apiKey || "",
        accept: 'application/json'
      },
      body: new URLSearchParams({
        origin: originCityId,
        destination: destinationCityId,
        weight: weightGrams.toString(),
        courier: courier
      }).toString(),
    });

    if (!response.ok) {
      console.error("Failed to fetch shipping cost from RajaOngkir", response.statusText);
      return null;
    }

    const data = await response.json();

    if (isPro) {
      return data.rajaongkir.results[0]; // Returns array of costs for the courier
    } else {
      // Map Komerce format to RajaOngkir standard format expected by the UI
      return {
        code: courier,
        name: data.data?.[0]?.name || courier,
        costs: data.data?.map((service: any) => ({
          service: service.service,
          description: service.description,
          cost: [
            {
              value: service.cost,
              etd: service.etd,
              note: ""
            }
          ]
        })) || []
      };
    }
  } catch (error) {
    console.error("Error calculating shipping cost:", error);
    return null;
  }
}

export async function getDistricts(cityId: string) {
  try {
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    const type = process.env.RAJAONGKIR_TYPE || 'starter';
    const baseUrl = type === 'pro' ? 'https://pro.rajaongkir.com/api' : 'https://rajaongkir.komerce.id/api/v1/destination';

    const isPro = type === 'pro';
    const url = isPro ? `${baseUrl}/subdistrict?city=${cityId}` : `${baseUrl}/district/${cityId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        key: apiKey || "",
        accept: 'application/json'
      },
      next: { revalidate: 86400 }
    });

    if (!response.ok) {
      console.error("Failed to fetch districts");
      return [];
    }

    const data = await response.json();
    return isPro ? data.rajaongkir.results : data.data;
  } catch (error) {
    console.error("Error fetching districts:", error);
    return [];
  }
}

export async function getVillages(districtId: string) {
  try {
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    const type = process.env.RAJAONGKIR_TYPE || 'starter';
    const baseUrl = type === 'pro' ? 'https://pro.rajaongkir.com/api' : 'https://rajaongkir.komerce.id/api/v1/destination';

    if (type === 'pro') {
      // Standard RajaOngkir doesn't have kelurahan/village level, so return empty for pro.
      return [];
    }

    const url = `${baseUrl}/sub-district/${districtId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        key: apiKey || "",
        accept: 'application/json'
      },
      next: { revalidate: 86400 }
    });

    if (!response.ok) {
      console.error("Failed to fetch villages");
      return [];
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching villages:", error);
    return [];
  }
}
