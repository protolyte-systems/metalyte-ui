import { Empty, Input, Spin, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";

import ConversationItem from "./ConversationItem";
import { getConversations } from "../../api/conversationApi";
import { listInboxConversations } from "../../api/inboxApi";

function ConversationList({ selectedConversation, setSelectedConversation, status = "" }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let active = true;

        const request = status === "" || status === "OPEN"
            ? getConversations()
            : listInboxConversations({ page: 0, size: 100, status });
        request
            .then((response) => {
                const body = response.data.data ?? response.data ?? [];
                const data = Array.isArray(body) ? body : (body.content ?? body);
                if (active) setConversations(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                console.error(error);
                return (status === "" || status === "OPEN" ? listInboxConversations({ page: 0, size: 100, ...(status ? { status } : {}) }) : getConversations()).then((response) => {
                    const data = response.data?.data ?? response.data ?? [];
                    const items = Array.isArray(data) ? data : (data.content ?? data);
                    if (active) setConversations(Array.isArray(items) ? items : []);
                }).catch(() => { if (active) setConversations([]); });
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [status]);

    const filteredConversations = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) return conversations;

        return conversations.filter((conversation) => {
            const name = conversation.name || conversation.displayName || conversation.contactName || conversation.phoneNumber || "";
            const lastMessage = conversation.lastMessage || conversation.preview || conversation.message || "";
            return `${name} ${lastMessage}`.toLowerCase().includes(value);
        });
    }, [conversations, query]);

    return (
        <div className="conversation-list">
            <div className="conversation-search-wrap">
                <Input
                    size="large"
                    placeholder="Search messages..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    prefix={<SearchOutlined />}
                    allowClear
                />
            </div>

            {loading ? (
                <div className="conversation-loading"><Spin /></div>
            ) : null}

            {!loading && filteredConversations.length === 0 ? (
                <div className="conversation-empty">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No conversations found" />
                    <Typography.Text type="secondary">Try a different search term.</Typography.Text>
                </div>
            ) : null}

            {!loading && filteredConversations.map((conversation) => (
                <ConversationItem
                    key={conversation.id || conversation.phoneNumber}
                    conversation={conversation}
                    selected={selectedConversation?.phoneNumber === conversation.phoneNumber}
                    onClick={() => setSelectedConversation(conversation)}
                />
            ))}
        </div>
    );
}

export default ConversationList;
