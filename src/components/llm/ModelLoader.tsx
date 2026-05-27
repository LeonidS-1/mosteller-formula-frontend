import type { FC } from "react";
import { Container } from "react-bootstrap";

interface ModelLoaderProps {
  progress: number;
}

const ModelLoader: FC<ModelLoaderProps> = ({ progress }) => (
  <Container className="loading">
    <p>Загрузка модели: {(progress * 100).toFixed(0)}%</p>
    <progress value={progress} max={1} />
  </Container>
);

export default ModelLoader;
