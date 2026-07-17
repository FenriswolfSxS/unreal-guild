import { json } from './_lib.js';

import { onRequestGet as buildsListGet } from './_handlers/builds/list.js';
import { onRequestDelete as buildsDelete } from './_handlers/builds/delete.js';
import { onRequestPost as buildsSavePost } from './_handlers/builds/save.js';
import { onRequestGet as classesGet } from './_handlers/classes.js';
import { onRequestGet as homeBubblesGet, onRequestPut as homeBubblesPut } from './_handlers/content/home-bubbles.js';
import { onRequestGet as contentPageGet, onRequestPut as contentPagePut } from './_handlers/content/page.js';
import { onRequestGet as guidesManageGet, onRequestPost as guidesManagePost } from './_handlers/guides/manage.js';
import { onRequestGet as forumsListGet } from './_handlers/forums/list.js';
import { onRequestGet as forumThreadsGet, onRequestPost as forumThreadsPost, onRequestPut as forumThreadsPut, onRequestDelete as forumThreadsDelete } from './_handlers/forums/threads.js';
import { onRequestPost as forumReplyPost } from './_handlers/forums/reply.js';
import { onRequestGet as healthGet } from './_handlers/health.js';
import { onRequestPost as loginPost } from './_handlers/login.js';
import { onRequestPost as logoutPost } from './_handlers/logout.js';
import { onRequestGet as meGet } from './_handlers/me.js';
import { onRequestPost as mediaDeletePost } from './_handlers/media/delete.js';
import { onRequestGet as mediaFileGet } from './_handlers/media/file.js';
import { onRequestGet as mediaListGet } from './_handlers/media/list.js';
import { onRequestPost as mediaUploadPost } from './_handlers/media/upload.js';
import { onRequestGet as membersListGet } from './_handlers/members/list.js';
import { onRequestPost as membersUpdatePost } from './_handlers/members/update.js';
import { onRequestGet as optionsGet } from './_handlers/options.js';
import { onRequestGet as profileGet, onRequestPost as profilePost } from './_handlers/profile.js';
import { onRequestGet as ranksGet } from './_handlers/ranks.js';
import { onRequestPost as registerPost } from './_handlers/register.js';
import { onRequestGet as rosterGet } from './_handlers/roster.js';

function routeKey(request) {
  const url = new URL(request.url);
  let path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  return path || 'health';
}

const routes = {
  'builds/list': { GET: buildsListGet },
  'builds/delete': { DELETE: buildsDelete },
  'builds/save': { POST: buildsSavePost },
  'classes': { GET: classesGet },
  'content/home-bubbles': { GET: homeBubblesGet, PUT: homeBubblesPut, POST: homeBubblesPut },
  'content/page': { GET: contentPageGet, PUT: contentPagePut, POST: contentPagePut },
  'forums/list': { GET: forumsListGet },
  'forums/threads': { GET: forumThreadsGet, POST: forumThreadsPost, PUT: forumThreadsPut, DELETE: forumThreadsDelete },
  'forums/reply': { POST: forumReplyPost },
  'guides/manage': { GET: guidesManageGet, POST: guidesManagePost },
  'health': { GET: healthGet },
  'login': { POST: loginPost },
  'logout': { POST: logoutPost },
  'me': { GET: meGet },
  'media/delete': { POST: mediaDeletePost, DELETE: mediaDeletePost },
  'media/file': { GET: mediaFileGet },
  'media/list': { GET: mediaListGet },
  'media/upload': { POST: mediaUploadPost },
  'members/list': { GET: membersListGet },
  'members/update': { POST: membersUpdatePost },
  'options': { GET: optionsGet },
  'profile': { GET: profileGet, POST: profilePost },
  'ranks': { GET: ranksGet },
  'register': { POST: registerPost },
  'roster': { GET: rosterGet },
};

export async function onRequest(context) {
  try {
    const key = routeKey(context.request);
    const method = context.request.method.toUpperCase();
    const handler = routes[key]?.[method];
    if (!handler) return json({ ok: false, error: `API route not found: ${method} /api/${key}` }, routes[key] ? 405 : 404);
    return await handler(context);
  } catch (err) {
    return json({ ok: false, error: err?.message || 'API error' }, 500);
  }
}
