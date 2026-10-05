import { Space, Spin, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";

import MarqButton from "../common/MarqButton";
import MarqInput from "../common/MarqInput";
import { tokens } from "../../theme/tokens";

export default function LoginForm({
    email,
    password,
    loading,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onForgotPassword
}) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 32, color: tokens.colors.textPrimary }}>
                Welcome back
            </Typography.Title>

            <MarqInput
                label="EMAIL ADDRESS"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                autoComplete="email"
                prefix={<MailOutlined style={{ color: "#C7C9DF" }} />}
                style={{ marginBottom: 24 }}
            />

            <div className="auth-password-row">
                <Typography.Text className="auth-field-label">PASSWORD</Typography.Text>
                <button type="button" className="auth-link-button auth-forgot-link" onClick={onForgotPassword}>
                    Forgot Password?
                </button>
            </div>

            <MarqInput
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                autoComplete="current-password"
                prefix={<LockOutlined style={{ color: "#C7C9DF" }} />}
                style={{ marginBottom: 28 }}
            />

            <MarqButton
                fullWidth
                size="large"
                variant="contained"
                type="submit"
                disabled={loading}
                style={{ minHeight: 64, marginBottom: 32, fontSize: 18 }}
            >
                {loading ? (
                    <Space size={10}>
                        <Spin size="small" />
                        Authenticating...
                    </Space>
                ) : (
                    "Sign In"
                )}
            </MarqButton>
        </form>
    );
}
