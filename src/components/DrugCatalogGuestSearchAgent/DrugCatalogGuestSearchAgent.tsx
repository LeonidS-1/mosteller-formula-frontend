import { useState } from "react";
import { Button } from "react-bootstrap";
import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { useAppSelector } from "../../store/hooks";
import useWebLLM from "../../hooks/llm/useWebLLM";
import ChatWindow from "../llm/ChatWindow";
import InputArea from "../llm/InputArea";
import ModelLoader from "../llm/ModelLoader";
import type { ChatMessage } from "../../LlmTypes";
import { DRUG_CATALOG_LLM_SYSTEM_PROMPT } from "../../modules/drugCatalogLlmPrompt";
import { parseDrugCatalogFilterFromLlm } from "../../modules/parseDrugCatalogFilterFromLlm";
import type { DrugCatalogFilterCriteria } from "../../modules/types";
import "../../Llm.css";
import "./DrugCatalogGuestSearchAgent.css";

interface DrugCatalogGuestSearchAgentProps {
  onApplyCriteria: (criteria: DrugCatalogFilterCriteria) => void;
}

function GuestAgentSession({ onApplyCriteria }: DrugCatalogGuestSearchAgentProps) {
  const { engine, progress, error, isLoading: modelLoading } = useWebLLM();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !engine) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const visibleMessages: ChatMessage[] = [...messages, userMessage];

    setMessages(visibleMessages);
    setInput("");
    setGenerating(true);

    try {
      const chatRequest: ChatCompletionMessageParam[] = [
        { role: "system", content: DRUG_CATALOG_LLM_SYSTEM_PROMPT },
        ...visibleMessages,
      ];

      const reply = await engine.chat.completions.create({
        messages: chatRequest,
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 256,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
      });

      const rawReply = reply.choices[0]?.message?.content ?? "";
      const parsed = parseDrugCatalogFilterFromLlm(rawReply);

      if (parsed.ok) {
        const title = parsed.criteria.title;
        const assistantText = title
          ? `Применяю поиск: «${title}»`
          : "Сбрасываю фильтр (пустой запрос).";
        setMessages([
          ...visibleMessages,
          { role: "assistant", content: assistantText },
        ]);
        onApplyCriteria({ title });
      } else {
        setMessages([
          ...visibleMessages,
          {
            role: "assistant",
            content: `Не удалось разобрать параметры поиска (${parsed.reason}). Попробуйте переформулировать.`,
          },
        ]);
      }
    } catch (err) {
      console.error("Ошибка генерации:", err);
      setMessages([
        ...visibleMessages,
        { role: "assistant", content: "Извините, произошла ошибка генерации." },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  if (modelLoading) {
    return <ModelLoader progress={progress} />;
  }

  if (error) {
    return (
      <div className="drug-catalog-guest-agent__error">
        <p>{error}</p>
        <p>Возможно, ваш браузер не поддерживает WebGPU. Попробуйте Chrome, Яндекс или Arc.</p>
      </div>
    );
  }

  return (
    <>
      <ChatWindow messages={messages} />
      <InputArea
        input={input}
        loading={generating}
        onInputChange={setInput}
        onSend={handleSend}
      />
    </>
  );
}

export default function DrugCatalogGuestSearchAgent({
  onApplyCriteria,
}: DrugCatalogGuestSearchAgentProps) {
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);
  const [started, setStarted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (isAuthenticated) return null;

  const toggleLabel = !started
    ? "Помощник поиска"
    : collapsed
      ? "Показать помощника"
      : "Скрыть помощника";

  const handleToggle = () => {
    if (!started) {
      setStarted(true);
      setCollapsed(false);
      return;
    }
    setCollapsed((c) => !c);
  };

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="drug-image-search-panel__btn-upload drug-catalog-guest-agent-toggle"
        onClick={handleToggle}
      >
        {toggleLabel}
      </Button>

      {started ? (
        <section
          className={`drug-catalog-guest-agent toolbar__clip-banner${collapsed ? " is-collapsed" : ""}`}
          aria-labelledby="drug-catalog-guest-agent-title"
          aria-hidden={collapsed}
        >
          <header className="drug-catalog-guest-agent__header">
            <h2
              id="drug-catalog-guest-agent-title"
              className="drug-catalog-guest-agent__title"
            >
              Помощник поиска препаратов
            </h2>
          </header>
          <div className="drug-catalog-guest-agent__body">
            <GuestAgentSession onApplyCriteria={onApplyCriteria} />
          </div>
        </section>
      ) : null}
    </>
  );
}
