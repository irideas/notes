import { feed } from '../lib/feed';
export async function GET({ site }) { return feed('zh-CN', site); }
