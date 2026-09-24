import { getWarehouseById } from "@/app/actions/warehouse";
import WarehouseForm from "../../_components/warehouse-form";
import { notFound } from "next/navigation";

interface EditWarehousePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditWarehousePage({ params }: EditWarehousePageProps) {
  const { id } = await params;
  
  const response = await getWarehouseById(id);
  if (!response.success || !response.data) {
    notFound();
  }

  const warehouse = response.data;
  const initialData = {
    warehouseName: warehouse.warehouseName,
    isMain: warehouse.isMain,
    province: warehouse.province,
    city: warehouse.city,
    cityId: warehouse.cityId,
    district: warehouse.district,
    districtId: warehouse.districtId,
    village: warehouse.village,
    villageId: warehouse.villageId,
    postcode: warehouse.postcode,
    streetAddress: warehouse.streetAddress,
    latitude: warehouse.latitude,
    longitude: warehouse.longitude,
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <WarehouseForm initialData={initialData} warehouseId={id} />
    </div>
  );
}
