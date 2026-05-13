import type { FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./DrugCatalogFilterBar.css";

interface DrugCatalogFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  className?: string;
}

export default function DrugCatalogFilterBar({
  query,
  onQueryChange,
  onSearch,
  className,
}: DrugCatalogFilterBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const rootClass = ["drug-catalog-filter-bar", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <Form onSubmit={handleSubmit} className="search-form drug-catalog-filter-bar__form">
        <Form.Control
          type="text"
          name="query"
          className="search-input"
          placeholder="Поиск препаратов..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <Button type="submit" className="search-btn">
          Найти
        </Button>
      </Form>
    </div>
  );
}
