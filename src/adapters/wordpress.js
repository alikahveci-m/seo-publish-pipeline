// WordPress REST adapter. An adapter has one job: make the site match the article,
// and say whether it had to change anything. Running it twice must change nothing.
export function wordpress({ baseUrl, user, appPassword }) {
  const authorization = `Basic ${Buffer.from(`${user}:${appPassword}`).toString('base64')}`;

  async function api(path, { method = 'GET', body } = {}) {
    const response = await fetch(`${baseUrl}/wp-json/wp/v2${path}`, {
      method,
      headers: { authorization, 'content-type': 'application/json' },
      body: body && JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`${method} ${path} failed with ${response.status}: ${detail}`);
    }
    return response.json();
  }

  return {
    async upsert(article) {
      const query = new URLSearchParams({ slug: article.slug, status: 'any', context: 'edit' });
      const [existing] = await api(`/posts?${query}`);

      if (existing?.status === 'publish' && existing.meta.pipeline_content_hash === article.hash) {
        return { id: existing.id, url: existing.link, action: 'unchanged' };
      }

      const saved = await api(existing ? `/posts/${existing.id}` : '/posts', {
        method: 'POST',
        body: {
          slug: article.slug,
          title: article.title,
          content: article.html,
          status: 'publish',
          meta: {
            pipeline_meta_description: article.description,
            pipeline_content_hash: article.hash,
          },
        },
      });
      return { id: saved.id, url: saved.link, action: existing ? 'updated' : 'created' };
    },
  };
}
