import { z } from 'zod';

export const subjectCreateSchema = z.object({
  name: z.string().min(1, '科目名称不能为空').max(50, '科目名称过长'),
  description: z.string().max(500, '描述过长').optional().nullable()
});

export const tagCreateSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(30, '标签名称过长')
});

export const noteCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题过长'),
  subjectId: z.string().min(1, '请选择科目'),
  contentJson: z.unknown(),
  plainText: z.string().max(100000, '内容过长').optional(),
  isWrongQuestion: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
  imagePaths: z.array(z.string()).optional()
});

export const noteUpdateSchema = noteCreateSchema.partial();
