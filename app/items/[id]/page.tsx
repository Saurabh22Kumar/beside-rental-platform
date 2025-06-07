import ItemPageClient from "./ItemPageClient";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params object to comply with Next.js 15 dynamic route requirements
  const { id } = await params;
  return <ItemPageClient itemId={id} />;
}
