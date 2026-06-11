export interface SubjectDTO {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TagDTO {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageAssetDTO {
  id: string;
  path: string;
  alt: string | null;
  mimeType: string | null;
  size: number | null;
  noteId: string | null;
  createdAt: string;
}

export interface NoteListItemDTO {
  id: string;
  title: string;
  plainText: string;
  isWrongQuestion: boolean;
  createdAt: string;
  updatedAt: string;
  subject: SubjectDTO;
  tags: TagDTO[];
}

export interface NoteDetailDTO extends NoteListItemDTO {
  contentJson: unknown;
  images: ImageAssetDTO[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface NoteQuery {
  subjectId?: string;
  tag?: string;
  title?: string;
  isWrongQuestion?: boolean;
  page?: number;
  pageSize?: number;
}
