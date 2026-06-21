import { ArrowRight, BookOpenText, ExternalLink } from 'lucide-react';

import type { TutorialItem } from '../../types/coding';

type RoadmapHint = {
  dayNumber: number;
};

interface TutorialViewerProps {
  tutorial: TutorialItem;
  roadmapHint?: RoadmapHint;
  practiceProblemLinks: Array<{ label: string; href: string }>;
}

function toYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return url;
      }
      const id = parsed.searchParams.get('v');
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch?.[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function TutorialViewer({ tutorial, roadmapHint, practiceProblemLinks }: TutorialViewerProps) {
  const videos = tutorial.video_links ?? [];
  const articleSnippets = tutorial.article_snippets ?? [];

  return (
    <article className="rounded-2xl border border-[#222A33] bg-[#151B22] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#E5E7EB]">{tutorial.title}</h3>
          <p className="mt-1 text-sm text-[#94A3B8]">{tutorial.topic}</p>
        </div>
        {roadmapHint ? (
          <span className="rounded-md border border-[#1D4ED8]/40 bg-[#1D4ED8]/15 px-2 py-1 text-xs text-[#93C5FD]">
            Roadmap Day {roadmapHint.dayNumber}
          </span>
        ) : null}
      </div>

      <section className="space-y-4 text-sm text-[#CBD5E1]">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-[#9CA3AF]">Concept</p>
          <p>{tutorial.concept}</p>
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-[#9CA3AF]">Time Complexity Analysis</p>
          <p>{tutorial.complexity}</p>
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-[#9CA3AF]">Code Example</p>
          <pre className="overflow-x-auto rounded-xl border border-[#222A33] bg-[#0B0F14] p-3 font-mono text-xs text-[#BFDBFE]">
            {tutorial.code_example}
          </pre>
        </div>

        {videos.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[#9CA3AF]">Video Lessons</p>
            <div className="space-y-2">
              {videos.slice(0, 3).map((url, index) => (
                <div key={`${tutorial.topic}-video-${url}`} className="space-y-2">
                  {toYoutubeEmbedUrl(url) ? (
                    <iframe
                      src={toYoutubeEmbedUrl(url) ?? undefined}
                      title={`${tutorial.title} video ${index + 1}`}
                      className="h-48 w-full rounded-lg border border-[#334155] bg-[#0F141A]"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : null}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#0F141A] px-3 py-2 text-xs text-[#93C5FD] hover:border-[#3B82F6]/50"
                  >
                    <span>Open Video {index + 1}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {articleSnippets.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[#9CA3AF]">Article With Code</p>
            <div className="space-y-3">
              {articleSnippets.map((snippet, index) => (
                <div key={`${tutorial.topic}-article-${index}`} className="rounded-xl border border-[#1F2937] bg-[#0B1120]/70 p-3">
                  <p className="text-sm font-semibold text-[#E5E7EB]">{snippet.title || `Snippet ${index + 1}`}</p>
                  {snippet.code ? (
                    <pre className="mt-2 overflow-x-auto rounded-lg border border-[#1F2937] bg-[#0B0F14] p-3 font-mono text-xs text-[#BFDBFE]">
                      {snippet.code}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-[#9CA3AF]">Common Mistakes</p>
          <p>{tutorial.practice_tips}</p>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-[#9CA3AF]">Practice Problems</p>
          <div className="flex flex-wrap gap-2">
            {practiceProblemLinks.map((link) => (
              <a
                key={`${tutorial.topic}-${link.label}`}
                href={link.href}
                className="inline-flex items-center gap-1 rounded-md border border-[#334155] bg-[#0F141A] px-3 py-1.5 text-xs text-[#CBD5E1] hover:border-[#3B82F6]/50"
              >
                {link.label}
                <ArrowRight className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>

        {tutorial.resource_link ? (
          <a
            href={tutorial.resource_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#60A5FA] hover:text-[#93C5FD]"
          >
            <BookOpenText className="h-4 w-4" />
            Open External Resource
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </section>
    </article>
  );
}
