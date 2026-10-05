import { useEffect, useMemo, useState } from "react";
import {
    Alert, Button, Card, Checkbox, Col, DatePicker, Divider, Form,
    Input, Modal, Row, Select, Space, Statistic, Steps, Table, Tag, Typography, message
} from "antd";
import { CheckCircleOutlined, ExperimentOutlined, RocketOutlined, SendOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { listContacts } from "../api/contactApi";
import { createCampaign, getCampaignRecipients, launchCampaign, listCampaigns, listTemplates, sendCampaignTest } from "../api/campaignApi";

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const statusColor = { COMPLETED: "success", RUNNING: "processing", SCHEDULED: "blue", PARTIALLY_FAILED: "warning", FAILED: "error", CANCELLED: "default", DRAFT: "default" };

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selected, setSelected] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [testOpen, setTestOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [campaignResponse, contactResponse, templateResponse] = await Promise.all([
                listCampaigns({ page: 0, size: 50, sort: "createdAt,desc" }),
                listContacts({ page: 0, size: 100, sort: "name,asc", eligibleOnly: true }),
                listTemplates()
            ]);
            const campaignPage = unwrap(campaignResponse);
            setCampaigns(campaignPage.content ?? campaignPage.items ?? campaignPage);
            const contactPage = unwrap(contactResponse);
            setContacts(contactPage.content ?? contactPage.items ?? contactPage);
            setTemplates(unwrap(templateResponse));
        } catch (error) {
            message.error(error?.response?.data?.message || "Unable to load campaign data");
        } finally { setLoading(false); }
    };
    useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, []);

    const templateOptions = templates.filter((template) => template.supported && template.status === "APPROVED");
    const values = Form.useWatch([], form) || {};
    const selectedTemplate = templateOptions.find((item) => item.name === values.templateName && item.language === values.templateLanguage);
    const selectedContacts = useMemo(() => contacts.filter((contact) => (values.contactIds || []).includes(contact.id)), [contacts, values.contactIds]);

    const reset = () => { form.resetFields(); setStep(0); setOpen(false); setTestOpen(false); };
    const handleCreate = async () => {
        try {
            const data = await form.validateFields();
            setSaving(true);
            const payload = {
                name: data.name, messageType: "TEMPLATE", templateName: data.templateName,
                templateLanguage: data.templateLanguage, templateParameters: data.templateParameters || [],
                scheduledAt: data.scheduledAt ? data.scheduledAt.toISOString() : null, contactIds: data.contactIds
            };
            await createCampaign(payload);
            message.success("Campaign saved"); reset(); await load();
        } catch (error) { if (error?.response) message.error(error.response.data?.message || "Campaign could not be saved"); }
        finally { setSaving(false); }
    };
    const showRecipients = async (campaign) => {
        setSelected(campaign);
        try { const response = await getCampaignRecipients(campaign.id, { page: 0, size: 100 }); const page = unwrap(response); setRecipients(page.content ?? page.items ?? page); }
        catch { message.error("Unable to load campaign recipients"); }
    };
    const handleTest = async (data) => {
        try { await sendCampaignTest({ contactId: data.contactId, templateName: values.templateName, templateLanguage: values.templateLanguage, templateParameters: data.templateParameters || [] }); message.success("Test message accepted by Meta"); setTestOpen(false); }
        catch (error) { message.error(error?.response?.data?.message || "Test send failed"); }
    };

    return <div className="campaigns-page" style={{ padding: 32, overflow: "auto" }}>
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <div><Typography.Title level={1} className="page-title">Campaigns</Typography.Title><Typography.Text type="secondary">Build a consent-aware audience, preview a template, and schedule delivery.</Typography.Text></div>
                <Button type="primary" icon={<RocketOutlined />} onClick={() => setOpen(true)}>Create campaign</Button>
            </Space>
            <Row gutter={[16, 16]}>{["RUNNING", "SCHEDULED", "COMPLETED"].map((status) => <Col xs={24} md={8} key={status}><Card><Statistic title={status[0] + status.slice(1).toLowerCase()} value={campaigns.filter((item) => item.status === status).length} /></Card></Col>)}</Row>
            <Card loading={loading} title="Your campaigns"><Table rowKey="id" dataSource={campaigns} pagination={{ pageSize: 10 }} columns={[{ title: "Campaign", dataIndex: "name" }, { title: "Type", dataIndex: "messageType" }, { title: "Status", dataIndex: "status", render: (status) => <Tag color={statusColor[status]}>{status}</Tag> }, { title: "Audience", dataIndex: ["analytics", "totalRecipients"] }, { title: "Sent", dataIndex: ["analytics", "sentCount"] }, { title: "Skipped", dataIndex: ["analytics", "skippedCount"] }, { title: "Action", render: (_, record) => <Space><Button type="link" onClick={() => showRecipients(record)}>View results</Button>{["DRAFT", "SCHEDULED", "FAILED", "PARTIALLY_FAILED"].includes(record.status) && <Button type="link" onClick={async () => { try { await launchCampaign(record.id); message.success("Campaign launch started"); await load(); } catch (error) { message.error(error?.response?.data?.message || "Launch failed"); } }}>Launch</Button>}</Space> }]} /></Card>
            {selected && <Card title={`${selected.name} recipients`} extra={<Button onClick={() => setSelected(null)}>Close</Button>}><Table rowKey="id" dataSource={recipients} pagination={{ pageSize: 10 }} columns={[{ title: "Contact", dataIndex: "name" }, { title: "Phone", dataIndex: "phoneNumber" }, { title: "Dispatch", dataIndex: "dispatchStatus", render: (value) => <Tag>{value}</Tag> }, { title: "Delivery", dataIndex: "deliveryStatus", render: (value) => value ? <Tag color={statusColor[value]}>{value}</Tag> : "-" }, { title: "Attempts", dataIndex: "attempts" }, { title: "Failure", dataIndex: "failureReason" }]} /></Card>}
        </Space>
        <Modal title="Create campaign" open={open} width={760} onCancel={reset} footer={null} destroyOnClose>
            <Steps current={step} items={[{ title: "Audience" }, { title: "Template" }, { title: "Review" }]} style={{ marginBottom: 28 }} />
            <Form form={form} layout="vertical">
                {step === 0 && <><Form.Item name="name" label="Campaign name" rules={[{ required: true }]}><Input placeholder="June product update" /></Form.Item><Form.Item name="contactIds" label={`Recipients (${selectedContacts.length} selected)`} rules={[{ required: true, message: "Select at least one recipient" }]}><Checkbox.Group style={{ width: "100%" }}><Row gutter={[8, 8]}>{contacts.map((contact) => <Col span={12} key={contact.id}><Checkbox value={contact.id}>{contact.name} · {contact.phoneNumber}</Checkbox></Col>)}</Row></Checkbox.Group></Form.Item></>}
                {step === 1 && <><Form.Item name="templateName" label="Approved template" rules={[{ required: true }]}><Select placeholder="Select a Meta approved template" onChange={() => form.setFieldValue("templateParameters", [])}>{templateOptions.map((template) => <Select.Option key={`${template.name}-${template.language}`} value={template.name}>{template.name} · {template.language}</Select.Option>)}</Select></Form.Item><Form.Item name="templateLanguage" label="Language" rules={[{ required: true }]}><Select placeholder="Select language">{templateOptions.filter((item) => item.name === values.templateName).map((item) => <Select.Option key={item.language} value={item.language}>{item.language}</Select.Option>)}</Select></Form.Item>{selectedTemplate && <Card size="small" title="Template preview"><Typography.Paragraph>{selectedTemplate.body}</Typography.Paragraph>{selectedTemplate.footer && <Typography.Text type="secondary">{selectedTemplate.footer}</Typography.Text>}{selectedTemplate.parameterCount > 0 && <Form.List name="templateParameters">{Array.from({ length: selectedTemplate.parameterCount }).map((_, index) => <Form.Item key={index} name={index} label={`Variable ${index + 1}`} rules={[{ required: true }]}><Input placeholder={`Value for {{${index + 1}}}`} /></Form.Item>)}</Form.List>}</Card>}{templates.length === 0 && <Alert type="info" showIcon message="No templates were returned. Configure the organization’s WhatsApp Business Account ID and access token first." />}</>}
                {step === 2 && <><Card><Space direction="vertical" size={12}><Typography.Text strong>{values.name}</Typography.Text><Typography.Text>{selectedContacts.length} eligible contacts selected</Typography.Text><Typography.Text>Template: {values.templateName} · {values.templateLanguage}</Typography.Text><Typography.Paragraph>{selectedTemplate?.body}</Typography.Paragraph></Space></Card><Form.Item name="scheduledAt" label="Schedule (optional)" style={{ marginTop: 20 }}><DatePicker showTime disabledDate={(date) => date && date < dayjs().startOf("day")} style={{ width: "100%" }} /></Form.Item><Alert type="info" showIcon message="Opted-out or inactive contacts are skipped automatically at dispatch time." /></>}
            </Form>
            <Divider /><Space style={{ width: "100%", justifyContent: "space-between" }}><Button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button><Space>{step === 1 && <Button icon={<ExperimentOutlined />} onClick={() => setTestOpen(true)}>Send test</Button>}{step < 2 ? <Button type="primary" onClick={async () => { try { await form.validateFields(step === 0 ? ["name", "contactIds"] : ["templateName", "templateLanguage", "templateParameters"]); setStep(step + 1); } catch {} }}>Continue</Button> : <Button type="primary" icon={<CheckCircleOutlined />} loading={saving} onClick={handleCreate}>Save campaign</Button>}</Space></Space>
        </Modal>
        <Modal title="Send a test message" open={testOpen} onCancel={() => setTestOpen(false)} footer={null}><Form layout="vertical" onFinish={handleTest}><Form.Item name="contactId" label="Test contact" rules={[{ required: true }]}><Select options={contacts.map((contact) => ({ value: contact.id, label: `${contact.name} · ${contact.phoneNumber}` }))} /></Form.Item><Form.List name="templateParameters">{Array.from({ length: selectedTemplate?.parameterCount || 0 }).map((_, index) => <Form.Item key={index} name={index} label={`Variable ${index + 1}`} rules={[{ required: true }]}><Input /></Form.Item>)}</Form.List><Button htmlType="submit" type="primary" icon={<SendOutlined />} block>Send test</Button></Form></Modal>
    </div>;
}
