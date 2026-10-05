import { Typography, Button, Segmented } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

import ConversationList from "../sidebar/ConversationList";

export default function ConversationPanel({
    selectedConversation,
    setSelectedConversation,
    onNewMessage
}) {
    const [status, setStatus] = useState("");
    return (
        <aside className="conversation-panel">
            <header
                className="conversation-panel-header"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
                <Typography.Title level={2} style={{ margin: 0 }}>
                    Messages
                </Typography.Title>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onNewMessage}
                >
                    New Message
                </Button>
            </header>

            <Segmented block value={status || "ALL"} onChange={(value) => setStatus(value === "ALL" ? "" : value)} options={["ALL", "OPEN", "PENDING", "RESOLVED"]} style={{ margin: "12px 16px" }} />

            <ConversationList
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
                status={status}
            />
        </aside>
    );
}
