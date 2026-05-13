import type { DrugCatalogItem } from "../../modules/types";
import DrugCatalogCard from "../DrugCatalogCard/DrugCatalogCard";

/** Как `.container` в rip2026/templates/index.html. */
export default function DrugCatalogGrid({
  drugs,
  scores,
}: {
  drugs: DrugCatalogItem[];
  scores?: Map<number, number>;
}) {
  return (
    <div className="container">
      {drugs.map((drug) => (
        <DrugCatalogCard
          key={`${drug.drug_id}-${drug.photo_url}`}
          drug={drug}
          similarityScore={scores?.get(drug.drug_id)}
        />
      ))}
    </div>
  );
}
