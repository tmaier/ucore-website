import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sortAnnouncements } from '../lib/announcements';

export async function GET() {
	const announcements = sortAnnouncements(await getCollection('announcements'));
	return rss({
		title: 'uCore announcements',
		description: 'Project news from uCore.',
		site: 'https://projectucore.org',
		items: announcements.map((item) => ({
			title: item.data.title,
			pubDate: new Date(`${item.data.date}T12:00:00Z`),
			description: item.data.summary,
			link: `/announcements/${item.data.slug}/`,
		})),
	});
}
