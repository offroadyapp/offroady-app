export type VideoItem = {
  type: 'youtube' | 'youtube_short' | 'external' | 'mp4';
  url: string;
  embedUrl?: string;
  title?: string;
  caption?: string;
  thumbnailUrl?: string;
  credit?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  updatedAt?: string;
  author: string;
  coverImage?: string;
  coverAlt?: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  relatedTrailSlug?: string;
  readingTime: string;
  status: 'draft' | 'published';
  body: string;
};
