import { useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import BreadCrumbs from "../../components/BreadCrumbs/BreadCrumbs";
import DrugCatalogFilterBar from "../../components/DrugCatalogFilterBar/DrugCatalogFilterBar";
import DrugCatalogGrid from "../../components/DrugCatalogGrid/DrugCatalogGrid";
import type { DrugCatalogFilterCriteria, DrugCatalogItem } from "../../modules/types";
import { DRUGS_CATALOG_MOCK, filterDrugsCatalog } from "../../modules/drugsCatalogMock";


export default function DrugCatalogPage() {
  const [drugs, setDrugs] = useState<DrugCatalogItem[]>(() => [...DRUGS_CATALOG_MOCK]);
  const [searchTitle, setSearchTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    try {
      const criteria: DrugCatalogFilterCriteria = { title: searchTitle };
      setDrugs(filterDrugsCatalog(DRUGS_CATALOG_MOCK, criteria));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="strategies-page">
      <div className="toolbar toolbar--catalog">
        <div className="toolbar__breadcrumbs">
          <BreadCrumbs className="app-breadcrumbs--toolbar" />
        </div>
        <div className="toolbar__center">
          <DrugCatalogFilterBar query={searchTitle} onQueryChange={setSearchTitle} onSearch={handleSearch} />
        </div>
      </div>
      <div className="space">
        <main className="strategies-page__main">
          {loading ? (
            <div className="strategies-page__loading">
              <Spinner animation="border" role="status" aria-label="Загрузка">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          ) : (
            <div className="strategies-page__grid">
              {drugs.length > 0 ? (
                <DrugCatalogGrid drugs={drugs} />
              ) : (
                <div className="strategies-page__empty">
                  {searchTitle.trim()
                    ? `По запросу «${searchTitle}» ничего не найдено`
                    : "Препараты не найдены"}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
