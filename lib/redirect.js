import cf from 'cloudfront';

const kvsHandle = cf.kvs();

// biome-ignore lint/correctness/noUnusedVariables: handler is used by CloudFront
async function handler() {
  const redirectUrl = await kvsHandle.get('url');

  /**
   * ここに詳細なロジックを追加できます
   */

  return {
    statusCode: 302,
    statusDescription: 'Found',
    headers: { location: { value: redirectUrl } },
  };
}
