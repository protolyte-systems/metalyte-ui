import { Alert, Button, Card, Empty, Pagination, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { CheckOutlined, CopyOutlined, DownloadOutlined, InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";

import { formatDateTimeIST } from "../../utils/time";
import { formatPhoneNumber } from "../../utils/format";

const statusColor = {
    SENT: "blue",
    DELIVERED: "green",
    READ: "green",
    FAILED: "red"
};

function CopyableCell({ value }) {
    const [copied, setCopied] = useState(false);
    const display = value || "-";

    const handleCopy = async (event) => {
        event.stopPropagation();
        if (!value) return;
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard may be unavailable in insecure contexts.
        }
    };

    return (
        <Space size={6} className="reports-copy-cell">
            <Tooltip title={display}>
                <Typography.Text ellipsis>{display}</Typography.Text>
            </Tooltip>
            {value ? (
                <Button type="text" size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy} />
            ) : null}
        </Space>
    );
}

function StatusTag({ value }) {
    return <Tag color={statusColor[value] || "default"}>{(value || "-").toLowerCase()}</Tag>;
}

function MobileReportCard({ message, onClick }) {
    return <Card size="small" className="mobile-report-card" onClick={onClick}>
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}><Typography.Text strong>{formatPhoneNumber(message.phoneNumber || message.toPhoneNumber) || "Unknown contact"}</Typography.Text><StatusTag value={message.currentStatus} /></Space>
            <Typography.Text type="secondary">{message.templateName || message.messageType || "Message"}</Typography.Text>
            <Space wrap size={[12, 4]}><Typography.Text type="secondary">Sent: {formatDateTimeIST(message.sentAt) || "-"}</Typography.Text><Typography.Text type="secondary">Read: {formatDateTimeIST(message.readAt) || "-"}</Typography.Text></Space>
            {message.failureReason ? <Typography.Text type="danger" ellipsis>{message.failureReason}</Typography.Text> : null}
        </Space>
    </Card>;
}

function makeColumns() {
    return [
        { title: "WhatsApp Message ID", dataIndex: "whatsappMessageId", key: "whatsappMessageId", width: 220, render: (value) => <CopyableCell value={value} /> },
        { title: "Contact", dataIndex: "phoneNumber", key: "phoneNumber", width: 150, render: (value) => formatPhoneNumber(value) || "-" },
        { title: "Recipient", dataIndex: "toPhoneNumber", key: "toPhoneNumber", width: 150, render: (value) => formatPhoneNumber(value) || "-" },
        { title: "Template", dataIndex: "templateName", key: "templateName", width: 170, ellipsis: true, render: (value) => value || "-" },
        { title: "Type", dataIndex: "messageType", key: "messageType", width: 120, render: (value) => <Typography.Text strong>{value || "-"}</Typography.Text> },
        { title: "Status", dataIndex: "currentStatus", key: "currentStatus", width: 130, render: (value) => <StatusTag value={value} /> },
        { title: "Sent", dataIndex: "sentAt", key: "sentAt", width: 180, sorter: true, render: (value) => formatDateTimeIST(value) || "-" },
        { title: "Delivered", dataIndex: "deliveredAt", key: "deliveredAt", width: 180, sorter: true, render: (value) => formatDateTimeIST(value) || "-" },
        { title: "Read", dataIndex: "readAt", key: "readAt", width: 180, sorter: true, render: (value) => formatDateTimeIST(value) || "-" },
        { title: "Failure Reason", dataIndex: "failureReason", key: "failureReason", width: 190, render: (value) => <CopyableCell value={value} /> },
        { title: "Created", dataIndex: "createdAt", key: "createdAt", width: 180, sorter: true, render: (value) => formatDateTimeIST(value) || "-" }
    ];
}

function downloadCsv(messages) {
    const columns = makeColumns().filter((column) => column.dataIndex);
    const rows = [columns.map((column) => column.title).join(",")];
    messages.forEach((message) => {
        rows.push(columns.map((column) => JSON.stringify(message[column.dataIndex] ?? "")).join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "message-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
}

export default function ReportsTable({
    messages,
    loading,
    error,
    page,
    pageSize,
    rowCount,
    sortModel,
    onPageChange,
    onSortModelChange,
    onRowClick,
    onRefresh,
    onReset,
    hasFilters,
    lastUpdated
}) {
    const safeRowCount = Number.isFinite(rowCount) ? rowCount : 0;
    const start = safeRowCount === 0 ? 0 : page * pageSize + 1;
    const end = Math.min(safeRowCount, (page + 1) * pageSize);
    const columns = useMemo(() => makeColumns(), []);
    const sortedInfo = sortModel?.[0] || {};

    return (
        <Card
            className="reports-table-card"
            bordered
            title={
                <div>
                    <Typography.Title level={3}>Message Reports</Typography.Title>
                    <Typography.Text type="secondary">Review message history with server-side pagination and sorting.</Typography.Text>
                </div>
            }
            extra={
                <Space wrap>
                    <Typography.Text type="secondary">
                        {safeRowCount === 0 ? "No messages" : `Showing ${start}-${end} of ${safeRowCount.toLocaleString("en-IN")}`}
                    </Typography.Text>
                    {lastUpdated ? <Typography.Text type="secondary">Last updated {formatDateTimeIST(lastUpdated)}</Typography.Text> : null}
                    <Button icon={<DownloadOutlined />} onClick={() => downloadCsv(messages)} disabled={!messages.length}>Export</Button>
                    <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>Refresh</Button>
                </Space>
            }
        >
            {error ? <Alert type="error" showIcon message={error} action={onRefresh ? <Button onClick={onRefresh}>Retry</Button> : null} style={{ marginBottom: 16 }} /> : null}

            <div className="desktop-report-table"><Table
                rowKey={(row) => row.id ?? row.whatsappMessageId}
                columns={columns.map((column) => ({
                    ...column,
                    sortOrder: sortedInfo.field === column.dataIndex ? (sortedInfo.sort === "asc" ? "ascend" : "descend") : null
                }))}
                dataSource={messages}
                loading={loading}
                pagination={false}
                scroll={{ x: 1700, y: 440 }}
                locale={{
                    emptyText: (
                        <Empty image={<InboxOutlined style={{ fontSize: 40 }} />} description="No messages match your filters">
                            {hasFilters ? <Button onClick={onReset}>Clear filters</Button> : null}
                        </Empty>
                    )
                }}
                onRow={(record) => ({ onClick: () => onRowClick?.({ row: record }) })}
                onChange={(_, __, sorter) => {
                    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
                    if (activeSorter?.field && activeSorter?.order) {
                        onSortModelChange([{ field: activeSorter.field, sort: activeSorter.order === "ascend" ? "asc" : "desc" }]);
                    } else {
                        onSortModelChange([]);
                    }
                }}
            /></div>
            <div className="mobile-report-list">
                {messages.length ? messages.map((message) => <MobileReportCard key={message.id ?? message.whatsappMessageId} message={message} onClick={() => onRowClick?.({ row: message })} />) : <Empty description="No messages match your filters" />}
            </div>

            <div className="reports-pagination-row">
                <Space>
                    <Typography.Text type="secondary">
                        {safeRowCount === 0 ? "No messages" : `Showing ${start}-${end} of ${safeRowCount.toLocaleString("en-IN")}`}
                    </Typography.Text>
                    <Select
                        value={pageSize}
                        onChange={(nextPageSize) => onPageChange(0, nextPageSize)}
                        disabled={loading}
                        options={[10, 20, 50].map((value) => ({ value, label: `${value} / page` }))}
                        style={{ width: 120 }}
                    />
                </Space>
                <Pagination
                    current={page + 1}
                    total={safeRowCount}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    showQuickJumper
                    disabled={loading}
                    onChange={(nextPage) => onPageChange(nextPage - 1, pageSize)}
                />
            </div>
        </Card>
    );
}
