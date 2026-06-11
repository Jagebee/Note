import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { getUserBackgroundImage, upsertUserBackgroundImage } from '@/lib/settings';

const backgroundSchema = z.object({
  backgroundImage: z.string().trim().max(2000).nullable()
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const backgroundImage = await getUserBackgroundImage(session.user.id);
  return ok({ backgroundImage });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = backgroundSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  const backgroundImage = parsed.data.backgroundImage || null;

  if (backgroundImage && !(backgroundImage.startsWith('/uploads/') || backgroundImage.startsWith('http://') || backgroundImage.startsWith('https://'))) {
    return fail('背景地址不合法', 'INVALID_BACKGROUND', 400);
  }

  await upsertUserBackgroundImage(session.user.id, backgroundImage);

  return ok({ backgroundImage });
}
