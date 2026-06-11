import { NoteReader } from '@/components/note-reader';

interface Props {
  params: { id: string };
}

export default function ViewNotePage({ params }: Props) {
  return <NoteReader noteId={params.id} />;
}
