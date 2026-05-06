import type { FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./DrugCatalogFilterBar.css";

interface DrugCatalogFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export default function DrugCatalogFilterBar({ query, onQueryChange, onSearch }: DrugCatalogFilterBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="drug-catalog-filter-bar">
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
