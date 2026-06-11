import { ImageAsset, Note, Subject, Tag } from '@prisma/client';

export function serializeSubject(subject: Subject) {
  return {
    ...subject,
    createdAt: subject.createdAt.toISOString(),
    updatedAt: subject.updatedAt.toISOString()
  };
}

export function serializeTag(tag: Tag) {
  return {
    ...tag,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString()
  };
}

export function serializeImage(image: ImageAsset) {
  return {
    ...image,
    createdAt: image.createdAt.toISOString(),
    updatedAt: image.updatedAt.toISOString()
  };
}

export function serializeNote(
  note: Note & {
    subject: Subject;
    tags: Tag[];
    images?: ImageAsset[];
  }
) {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    subject: serializeSubject(note.subject),
    tags: note.tags.map(serializeTag),
    images: note.images?.map(serializeImage) ?? []
  };
}
