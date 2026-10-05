import { useEffect, useState } from "react";
import { Input, Select, Space } from "antd";

import ChatBody from "../components/chat/ChatBody";
import ChatHeader from "../components/chat/ChatHeader";
import ChatInput from "../components/chat/ChatInput";
import NewMessageModal from "../components/chat/NewMessageModal";
import ConversationPanel from "../components/conversations/ConversationPanel";
import { useLayoutActions } from "../layout/useLayoutActions";

import { getMessages, sendTextMessage } from "../api/conversationApi";
import sseClient, { useSseEvent } from "../services/sseService";
import { updateInboxConversation } from "../api/inboxApi";

function messageBelongsToConversation(message, conversation) {
    if (!conversation?.phoneNumber) return false;
    const phone = String(conversation.phoneNumber);
    const candidates = [
        message.phoneNumber,
        message.conversationPhoneNumber,
        message.to,
        message.from,
        message.recipient,
        message.sender
    ];
    return candidates
        .filter(Boolean)
        .map(String)
        .some((value) => value === phone || value.endsWith(phone));
}

export default function InboxPage() {
    const { registerNewMessageHandler } = useLayoutActions();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [conversationUpdating, setConversationUpdating] = useState(false);

    const updateConversation = async (payload) => {
        if (!selectedConversation?.id) return;
        try { setConversationUpdating(true); const response = await updateInboxConversation(selectedConversation.id, payload); setSelectedConversation(response.data?.data ?? response.data); }
        finally { setConversationUpdating(false); }
    };

    useEffect(() => {
        registerNewMessageHandler(() => setComposeOpen(true));
        return () => registerNewMessageHandler(null);
    }, [registerNewMessageHandler]);

    useEffect(() => {
        if (!selectedConversation?.phoneNumber) return;
        let active = true;

        const loadMessages = async () => {
            try {
                setMessagesLoading(true);
                const response = await getMessages(selectedConversation.phoneNumber);
                const data = response.data?.data ?? response.data ?? [];
                if (active) setMessages(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(error);
                if (active) setMessages([]);
            } finally {
                if (active) setMessagesLoading(false);
            }
        };

        loadMessages();
        return () => {
            active = false;
        };
    }, [selectedConversation]);

    useSseEvent("new-message", (message) => {
        if (!message) return;
        if (!messageBelongsToConversation(message, selectedConversation)) return;
        setMessages((prev) => {
            const incomingId = message.id || message.messageId;
            if (incomingId && prev.some((m) => (m.id || m.messageId) === incomingId)) {
                return prev;
            }
            return [...prev, message];
        });
    });

    useEffect(() => {
        const unsubscribe = sseClient.onStatusChange((status, detail) => {
            if (status === "error") console.warn("[sse] connection error", detail);
            else console.log("[sse] status", status, detail ?? "");
        });
        return unsubscribe;
    }, []);

    const handleSendMessage = async (messageText) => {
        if (!selectedConversation?.phoneNumber || !messageText?.trim()) return;

        try {
            const response = await sendTextMessage({
                to: selectedConversation.phoneNumber,
                body: messageText
            });

            const sentMessage =
                response.data?.data ??
                {
                    id: Date.now(),
                    body: messageText,
                    direction: "OUTBOUND",
                    createdAt: new Date().toISOString()
                };

            setMessages((prev) => [...prev, sentMessage]);
        } catch (error) {
            console.error("Failed to send message", error);
            throw error;
        }
    };

    const handleComposeSend = async ({ to, body }) => {
        const response = await sendTextMessage({ to, body });
        const sentMessage =
            response.data?.data ?? {
                id: Date.now(),
                body,
                direction: "OUTBOUND",
                to,
                createdAt: new Date().toISOString()
            };

        setMessages((prev) => [...prev, sentMessage]);
        setSelectedConversation((current) => {
            if (current && current.phoneNumber === to) return current;
            return current ?? { phoneNumber: to, name: to, displayName: to };
        });
        setComposeOpen(false);
    };

    return (
        <div className="inbox-page">
            <div className="inbox-main">
                <ConversationPanel
                    selectedConversation={selectedConversation}
                    setSelectedConversation={setSelectedConversation}
                    onNewMessage={() => setComposeOpen(true)}
                />

                <section className="inbox-chat-panel">
                    <ChatHeader conversation={selectedConversation} />
                    {selectedConversation?.id ? <div style={{ padding: "8px 20px", borderBottom: "1px solid var(--border-color, #eee)" }}><Space><Select size="small" value={selectedConversation.status || "OPEN"} loading={conversationUpdating} onChange={(status) => updateConversation({ status, assignedUserId: selectedConversation.assignedUserId, internalNote: selectedConversation.internalNote || null })} options={["OPEN", "PENDING", "RESOLVED"].map((value) => ({ value, label: value }))} /><Input size="small" placeholder="Internal note" defaultValue={selectedConversation.internalNote || ""} onPressEnter={(event) => updateConversation({ status: selectedConversation.status || "OPEN", assignedUserId: selectedConversation.assignedUserId, internalNote: event.target.value })} style={{ width: 240 }} /></Space></div> : null}
                    <ChatBody
                        conversation={selectedConversation}
                        messages={messages}
                        loading={messagesLoading}
                    />
                    <ChatInput disabled={!selectedConversation} onSend={handleSendMessage} />
                </section>
            </div>

            <NewMessageModal
                open={composeOpen}
                onClose={() => setComposeOpen(false)}
                onSend={handleComposeSend}
            />
        </div>
    );
}
