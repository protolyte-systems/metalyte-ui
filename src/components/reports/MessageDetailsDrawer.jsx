import { Button, Descriptions, Divider, Drawer, Grid, Space, Tag, Tooltip, Typography } from "antd";
import { CheckOutlined, CloseOutlined, CopyOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import StatusTimeline from "./StatusTimeline";
import { formatDateTimeIST } from "../../utils/time";
import { formatPhoneNumber } from "../../utils/format";

const statusChipColor = {
    SENT: "blue",
    DELIVERED: "green",
    READ: "green",
    FAILED: "red"
};

function CopyableField({ label, value, monospace = false }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return undefined;
        const timer = window.setTimeout(() => setCopied(false), 1500);
        return () => window.clearTimeout(timer);
    }, [copied]);

    const handleCopy = async () => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
        } catch {
            // Ignore clipboard failures.
        }
    };

    return {
        key: label,
        label,
        children: (
            <Space size={6} align="start">
                <Typography.Text className={monospace ? "reports-mono" : undefined} style={{ wordBreak: "break-word" }}>
                    {value ?? "-"}
                </Typography.Text>
                {value ? (
                    <Tooltip title={copied ? "Copied" : "Copy"}>
                        <Button type="text" size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy} />
                    </Tooltip>
                ) : null}
            </Space>
        )
    };
}

function DetailField(label, value, monospace = false) {
    return {
        key: label,
        label,
        children: <Typography.Text className={monospace ? "reports-mono" : undefined}>{value ?? "-"}</Typography.Text>
    };
}

export default function MessageDetailsDrawer({ message, messages = [], onClose, onNavigate }) {
    const screens = Grid.useBreakpoint();
    if (!message) return null;
    const drawerWidth = screens.md ? 580 : "100vw";

    const timelineHistory = message.statusHistory || [];
    const currentIndex = messages.findIndex((m) => (m.id ?? m.whatsappMessageId) === (message.id ?? message.whatsappMessageId));
    const canPrev = currentIndex > 0;
    const canNext = currentIndex >= 0 && currentIndex < messages.length - 1;
    const positionLabel = currentIndex >= 0 ? `${currentIndex + 1} of ${messages.length}` : null;

    const fields = [
        CopyableField({ label: "Message ID", value: message.id ?? message.messageId, monospace: true }),
        CopyableField({ label: "WhatsApp Message ID", value: message.whatsappMessageId, monospace: true }),
        DetailField("Contact ID", message.contactId, true),
        DetailField("Campaign ID", message.campaignId, true),
        DetailField("Template Name", message.templateName),
        DetailField("Message Type", message.messageType),
        DetailField("Contact", formatPhoneNumber(message.phoneNumber)),
        DetailField("Recipient", formatPhoneNumber(message.toPhoneNumber)),
        DetailField("Sent Time", formatDateTimeIST(message.sentAt)),
        DetailField("Delivered Time", formatDateTimeIST(message.deliveredAt)),
        DetailField("Read Time", formatDateTimeIST(message.readAt)),
        DetailField("Failed Time", formatDateTimeIST(message.failedAt)),
        CopyableField({ label: "Failure Reason", value: message.failureReason }),
        DetailField("Created At", formatDateTimeIST(message.createdAt)),
        DetailField("Updated At", formatDateTimeIST(message.updatedAt))
    ];

    return (
        <Drawer
            open={Boolean(message)}
            onClose={onClose}
            width={drawerWidth}
            placement="right"
            styles={{
                body: { padding: screens.md ? 24 : 16, overflowX: "hidden" },
                header: { padding: screens.md ? "16px 24px" : "14px 16px" }
            }}
            title={
                <div>
                    <Space wrap>
                        <Typography.Title level={3} style={{ margin: 0 }}>Message Details</Typography.Title>
                        {message.currentStatus ? <Tag color={statusChipColor[message.currentStatus] || "default"}>{message.currentStatus.toLowerCase()}</Tag> : null}
                    </Space>
                    <Typography.Text type="secondary">Full payload and delivery history.</Typography.Text>
                    {positionLabel ? <Typography.Text type="secondary" style={{ display: "block" }}>Viewing record {positionLabel} on this page</Typography.Text> : null}
                </div>
            }
            extra={
                <Space>
                    <Tooltip title="Previous message"><Button size="small" icon={<LeftOutlined />} disabled={!canPrev} onClick={() => canPrev && onNavigate?.(currentIndex - 1)} /></Tooltip>
                    <Tooltip title="Next message"><Button size="small" icon={<RightOutlined />} disabled={!canNext} onClick={() => canNext && onNavigate?.(currentIndex + 1)} /></Tooltip>
                    <Tooltip title="Close"><Button size="small" icon={<CloseOutlined />} onClick={onClose} /></Tooltip>
                </Space>
            }
        >
            <Descriptions column={1} size="small" bordered items={fields} />

            <Divider orientation="left">Message Body</Divider>
            <div className="reports-message-body">
                <Typography.Text>{message.body ?? message.messageBody ?? "-"}</Typography.Text>
            </div>

            <Divider orientation="left">Status History</Divider>
            <StatusTimeline history={timelineHistory} />
        </Drawer>
    );
}
