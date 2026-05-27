import type { FC } from "react";
import { Container } from "react-bootstrap";
import type { ChatMessage } from "../../LlmTypes";

interface MessageProps {
  msg: ChatMessage;
}

const Message: FC<MessageProps> = ({ msg }) => (
  <Container className={`msg ${msg.role}`}>
    <strong>{msg.role === "user" ? "Вы" : "НС"}: </strong>
    {msg.content}
  </Container>
);

export default Message;
