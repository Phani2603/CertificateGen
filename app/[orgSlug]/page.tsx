import { redirect } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  // Redirect to the dashboard
  redirect(`/${orgSlug}/dashboard`)
}
