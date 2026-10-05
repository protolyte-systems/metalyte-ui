import { App, Space, Typography } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import LoginForm from "../components/auth/LoginForm";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";
import BrandLogo from "../components/common/BrandLogo";
import MarqCard from "../components/common/MarqCard";
import { useAuth } from "../context/useAuth";
import { login } from "../services/authService";
import { tokens } from "../theme/tokens";

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { message } = App.useApp();
    const { signIn } = useAuth();

    const redirectTo =
        location.state?.from?.pathname ||
        new URLSearchParams(location.search).get("from") ||
        "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [forgotOpen, setForgotOpen] = useState(false);

    const handleLogin = async () => {
        try {
            setLoading(true);
            const data = await login(email, password);

            signIn({
                accessToken: data.accessToken,
                user: data.user,
                organization: data.organization,
                refreshToken: data.refreshToken
            });

            navigate(redirectTo, { replace: true });
        } catch (error) {
            message.error(error?.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main
            className="auth-page auth-page-login"
            style={{
                minHeight: "100vh",
                width: "100%",
                padding: "56px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "radial-gradient(circle at 12% 12%, rgba(47,24,246,0.08), transparent 26rem), radial-gradient(circle at 88% 18%, rgba(59,130,246,0.08), transparent 21rem), linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 48%, #EEF2FF 100%)"
            }}
        >
            <section className="auth-split-shell">
                <div className="auth-form-pane">
                <Space direction="vertical" align="center" size={10} style={{ width: "100%", marginBottom: 36 }}>
                    <BrandLogo style={{ width: "min(330px, 78vw)" }} />
                    <Typography.Text style={{ color: tokens.colors.textSecondary, fontSize: 17 }}>
                        Business Communication Platform
                    </Typography.Text>
                </Space>

                <MarqCard>
                    <div style={{ padding: "40px min(40px, 7vw)" }}>
                        <LoginForm
                            email={email}
                            password={password}
                            loading={loading}
                            onEmailChange={setEmail}
                            onPasswordChange={setPassword}
                            onSubmit={handleLogin}
                            onForgotPassword={() => setForgotOpen(true)}
                        />
                    </div>
                </MarqCard>

                <Typography.Paragraph style={{ color: tokens.colors.textSecondary, textAlign: "center", marginTop: 28, marginBottom: 0 }}>
                    Don&apos;t have an account?{" "}
                    <button type="button" className="auth-link-button" onClick={() => navigate("/register")}>
                        Register Now
                    </button>
                </Typography.Paragraph>

                <Space align="center" style={{ width: "100%", justifyContent: "center", marginTop: 48, color: tokens.colors.textMuted }}>
                    <SafetyCertificateOutlined />
                    <Typography.Text style={{ color: tokens.colors.textMuted, fontSize: 12, fontWeight: 700 }}>
                        A product from Protolyte Systems
                    </Typography.Text>
                </Space>
                </div>
                <AuthProductPanel />
            </section>
            <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} onSuccess={() => { setForgotOpen(false); message.success("Password updated. Sign in with your new password."); }} />
        </main>
    );
}

function AuthProductPanel() {
    return <aside className="auth-product-pane">
        <div className="auth-product-eyebrow">METALYTE BUSINESS OS</div>
        <Typography.Title level={1}>Every customer conversation, beautifully organized.</Typography.Title>
        <Typography.Paragraph>Connect WhatsApp, contacts, campaigns, and insights in one calm workspace built for teams that move quickly.</Typography.Paragraph>
        <div className="auth-product-visual">
            <div className="auth-visual-header"><span className="auth-live-dot" />Live business overview <Typography.Text>Today</Typography.Text></div>
            <div className="auth-visual-metrics"><div><Typography.Text>Messages sent</Typography.Text><strong>12,480</strong><small>+18.4%</small></div><div><Typography.Text>Delivery rate</Typography.Text><strong>96.8%</strong><small>Healthy</small></div></div>
            <div className="auth-visual-bars"><span style={{ height: "38%" }} /><span style={{ height: "58%" }} /><span style={{ height: "46%" }} /><span style={{ height: "76%" }} /><span style={{ height: "64%" }} /><span style={{ height: "92%" }} /><span style={{ height: "72%" }} /></div>
            <div className="auth-visual-footer"><span>Inbox</span><span>Campaigns</span><span>Analytics</span></div>
        </div>
        <div className="auth-product-pills"><span>WhatsApp inbox</span><span>Smart campaigns</span><span>Live analytics</span></div>
    </aside>;
}

export default LoginPage;
