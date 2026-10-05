import { Button, Card, Dropdown, Empty, Space, Spin, Table, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, MessageOutlined, MoreOutlined, PlusOutlined, TagsOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import MarqAvatar from "../common/MarqAvatar";
import { formatPhoneNumber, getInitials } from "../../utils/format";
import { formatDateTimeIST, formatRelativeShortIST } from "../../utils/time";

function getContactName(contact) {
    return contact.name || contact.displayName || contact.fullName || "Unnamed contact";
}

function getContactTime(contact) {
    return (
        contact.lastContactedAt ||
        contact.lastMessageAt ||
        contact.updatedAt ||
        contact.createdAt ||
        null
    );
}

function ContactCell({ contact }) {
    const name = getContactName(contact);
    const notes = contact.notes || "";
    return (
        <Space size={14} className="contacts-name-cell">
            <MarqAvatar size={32}>{getInitials(name)}</MarqAvatar>
            <div className="contacts-name-copy">
                <Typography.Text strong className="contacts-name-text">
                    {name}
                </Typography.Text>
                {notes && (
                    <Typography.Text type="secondary" className="contacts-notes-text">
                        {notes}
                    </Typography.Text>
                )}
            </div>
        </Space>
    );
}

function MobileContactCard({ contact, onOpen }) {
    const name = getContactName(contact);
    return <Card size="small" className="mobile-contact-card" onClick={() => onOpen?.(contact)}>
        <Space style={{ width: "100%" }} align="start"><MarqAvatar size={42}>{getInitials(name)}</MarqAvatar><div style={{ minWidth: 0, flex: 1 }}><Typography.Text strong>{name}</Typography.Text><Typography.Text type="secondary" style={{ display: "block" }}>{formatPhoneNumber(contact.phoneNumber) || "-"}</Typography.Text>{contact.email ? <Typography.Text type="secondary" ellipsis style={{ display: "block" }}>{contact.email}</Typography.Text> : null}</div><Button type="text" shape="circle" icon={<MessageOutlined />} onClick={(event) => { event.stopPropagation(); navigate("/", { state: { openPhoneNumber: contact.phoneNumber } }); }} /></Space>
    </Card>;
}

export default function ContactList({
    contacts,
    loading,
    onOpen,
    onCreateClick,
    hasMore = false,
    loadingMore = false,
    sentinelRef,
    selectedRowKeys = [],
    onSelectionChange
}) {
    const navigate = useNavigate();

    const columns = [
        {
            title: "Contact",
            dataIndex: "name",
            key: "contact",
            width: 350,
            render: (_, contact) => <ContactCell contact={contact} />
        },
        {
            title: "Phone",
            dataIndex: "phoneNumber",
            key: "phoneNumber",
            width: 150,
            render: (phoneNumber) => formatPhoneNumber(phoneNumber) || "-"
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 220,
            render: (email) => email || <Typography.Text type="secondary">No email</Typography.Text>
        },
        {
            title: "Tags",
            key: "tags",
            width: 180,
            render: (_, contact) => contact.tags?.length
                ? <Space size={[4, 4]} wrap>{contact.tags.map((tag) => <Tag key={tag} color="blue">{tag}</Tag>)}</Space>
                : <Typography.Text type="secondary">-</Typography.Text>
        },
        {
            title: "Updated",
            key: "updatedAt",
            width: 190,
            render: (_, contact) => formatDateTimeIST(getContactTime(contact)) || "-"
        },
        {
            title: "Last seen",
            key: "lastSeen",
            width: 120,
            render: (_, contact) => formatRelativeShortIST(getContactTime(contact)) || "-"
        },
        {
            title: "",
            key: "action",
            width: 72,
            align: "right",
                render: (_, contact) => (
                    <Dropdown menu={{ items: [
                        { key: "view", label: "View contact", icon: <UserOutlined /> },
                        { key: "message", label: "Send message", icon: <MessageOutlined /> },
                        { key: "edit", label: "Edit contact", icon: <EditOutlined /> },
                        { key: "tag", label: "Add tag", icon: <TagsOutlined /> },
                        { type: "divider" },
                        { key: "delete", label: "Delete contact", icon: <DeleteOutlined />, danger: true }
                    ], onClick: ({ key }) => { if (key === "message") navigate("/", { state: { openPhoneNumber: contact.phoneNumber } }); else if (key === "view") onOpen?.(contact); }}} trigger={["click"]}>
                        <Button type="text" shape="circle" icon={<MoreOutlined />} onClick={(event) => event.stopPropagation()} />
                    </Dropdown>
                )
        }
    ];

    if (!loading && !contacts.length) {
        return (
            <div className="contacts-empty">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            <strong>No contacts yet</strong>
                            <br />
                            Add your first contact to start a conversation.
                        </span>
                    }
                >
                    <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick}>
                        Add contact
                    </Button>
                </Empty>
            </div>
        );
    }

    return (
        <div className="contacts-table-shell">
            <div className="mobile-contact-list">{contacts.map((contact) => <MobileContactCard key={contact.id || contact.phoneNumber} contact={contact} onOpen={onOpen} />)}</div>
            <div className="desktop-contact-table">
            <Table
                rowKey={(contact) => contact.id || contact.contactId || contact.phoneNumber}
                columns={columns}
                dataSource={contacts}
                loading={loading}
                pagination={false}
                sticky
                scroll={{ x: 1100 }}
                onRow={(contact) => ({
                    onClick: () => onOpen?.(contact)
                })}
                className="contacts-table"
                rowSelection={{ selectedRowKeys, onChange: onSelectionChange, columnWidth: 38 }}
            />
            </div>
            <div ref={sentinelRef} className="contacts-load-row">
                {hasMore ? (
                    <Space size={10}>
                        <Spin size="small" />
                        <Typography.Text type="secondary">
                            {loadingMore ? "Loading next page..." : "Scroll to load more"}
                        </Typography.Text>
                    </Space>
                ) : (
                    <Typography.Text type="secondary">You've reached the end</Typography.Text>
                )}
            </div>
        </div>
    );
}
