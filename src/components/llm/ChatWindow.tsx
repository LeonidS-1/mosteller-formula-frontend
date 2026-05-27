import type { FC } from "react";
import { Container } from "react-bootstrap";
import type { ChatMessage } from "../../LlmTypes";
import Message from "./Message";

interface ChatWindowProps {
  messages: ChatMessage[];
}

const ChatWindow: FC<ChatWindowProps> = ({ messages }) => (
  <Container className="chat-window">
    {messages
      .filter((msg) => msg.role !== "system")
      .map((msg, idx) => (
        <Message key={idx} msg={msg} />
      ))}
  </Container>
);

export default ChatWindow;
