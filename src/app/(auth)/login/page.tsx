import { LoginForm } from "./LoginForm";

interface Props {
  searchParams: Promise<{ registered?: string; verified?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <LoginForm
      registered={params.registered === "1"}
      verified={params.verified === "1"}
      invalidToken={params.error === "invalid-token"}
    />
  );
}
