import type { CollectionEntry } from 'astro:content';

export type Announcement = CollectionEntry<'announcements'>;

export function sortAnnouncements(items: Announcement[]): Announcement[] {
	return [...items].sort((a, b) => b.data.date.localeCompare(a.data.date) || a.data.slug.localeCompare(b.data.slug));
}

export function formatAnnouncementDate(date: string): string {
	const [year, month, day] = date.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	});
}
