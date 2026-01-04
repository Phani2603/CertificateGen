
export default function Page({ params }: { params: { orgSlug: string } }) {
  return <div>Organization: {params.orgSlug}</div>
}
