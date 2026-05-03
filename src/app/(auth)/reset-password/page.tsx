import { ResetPasswordForm } from "./ResetPasswordForm";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
