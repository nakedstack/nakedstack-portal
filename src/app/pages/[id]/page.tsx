import { PageEditor } from '@/components/page-editor/PageEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PageRoute({ params }: Props) {
  const { id } = await params;
  return <PageEditor pageId={id} />;
}
