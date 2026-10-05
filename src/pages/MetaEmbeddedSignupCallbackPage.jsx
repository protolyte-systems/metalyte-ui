import { useEffect } from "react";
import { Spin, Typography, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { completeEmbeddedSignup } from "../api/organizationApi";

export default function MetaEmbeddedSignupCallbackPage() {
  const [params] = useSearchParams(); const navigate = useNavigate();
  useEffect(() => { const code = params.get("code"); if (!code) { message.error("Meta authorization was cancelled"); navigate("/settings", { replace: true }); return; } completeEmbeddedSignup(code).then(() => { message.success("WhatsApp connected successfully"); navigate("/settings", { replace: true }); }).catch((error) => { message.error(error?.response?.data?.message || "Meta onboarding could not be completed"); navigate("/settings", { replace: true }); }); }, [navigate, params]);
  return <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}><div style={{ textAlign: "center" }}><Spin size="large" /><Typography.Title level={4}>Finishing WhatsApp setup…</Typography.Title><Typography.Text type="secondary">Metalyte is securely connecting your Meta business.</Typography.Text></div></div>;
}
