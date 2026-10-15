import { feed } from '../../lib/feed';
export async function GET({ site }) { return feed('en', site); }
