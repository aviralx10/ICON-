import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ tenant: string }>;
}

export default async function CasesRedirectPage({ params }: PageProps) {
  const { tenant } = await params;
  redirect(`/${tenant}`);
}
