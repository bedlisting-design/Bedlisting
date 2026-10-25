import PropertyForm from "@/components/PropertyForm";

export default function AdminNewPropertyPage() {
  return <PropertyForm mode="admin" doneHref="/admin/properties" />;
}
