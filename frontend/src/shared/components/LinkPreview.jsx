import { ExternalLink, Instagram, Radio, Video } from 'lucide-react';

function getLinkMeta(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const lowered = host.toLowerCase();

    if (lowered.includes('tiktok')) {
      return { label: 'TikTok', icon: Video, host, tone: 'video' };
    }

    if (lowered.includes('instagram')) {
      return { label: parsed.pathname.includes('live') ? 'Instagram Live' : 'Instagram', icon: Instagram, host, tone: 'ig' };
    }

    return { label: 'Link del evento', icon: Radio, host, tone: 'default' };
  } catch {
    return null;
  }
}

export default function LinkPreview({ url }) {
  const meta = getLinkMeta(url);
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <a className={`link-preview link-preview-${meta.tone}`} href={url} target="_blank" rel="noreferrer">
      <span className="link-preview-icon"><Icon size={22} /></span>
      <span>
        <strong>{meta.label}</strong>
        <small>{meta.host}</small>
      </span>
      <ExternalLink size={18} aria-hidden="true" />
    </a>
  );
}
