import { NoteEditorForm } from '@/components/note-editor-form';

interface Props {
  params: { id: string };
}

export default function EditNotePage({ params }: Props) {
  return <NoteEditorForm noteId={params.id} />;
}
