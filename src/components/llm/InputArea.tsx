import type { FC } from "react";
import { Button } from "react-bootstrap";

interface InputAreaProps {
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

const InputArea: FC<InputAreaProps> = ({
  input,
  loading,
  onInputChange,
  onSend,
}) => (
  <>
    <textarea
      rows={3}
      placeholder="Опишите, какой препарат ищете..."
      value={input}
      onChange={(e) => onInputChange(e.target.value)}
    />
    <Button onClick={onSend} disabled={loading || !input.trim()}>
      {loading ? "Генерация..." : "Подобрать поиск"}
    </Button>
  </>
);

export default InputArea;
