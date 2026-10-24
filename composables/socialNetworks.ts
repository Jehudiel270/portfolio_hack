export const socialNetworks = [
  { id: 'github', label: 'GitHub', icon: 'simple-icons:github' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'simple-icons:linkedin' },
  { id: 'instagram', label: 'Instagram', icon: 'simple-icons:instagram' },
  { id: 'x', label: 'X / Twitter', icon: 'simple-icons:x' },
  { id: 'facebook', label: 'Facebook', icon: 'simple-icons:facebook' },
  { id: 'youtube', label: 'YouTube', icon: 'simple-icons:youtube' },
  { id: 'tiktok', label: 'TikTok', icon: 'simple-icons:tiktok' },
  { id: 'discord', label: 'Discord', icon: 'simple-icons:discord' },
  { id: 'telegram', label: 'Telegram', icon: 'simple-icons:telegram' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'simple-icons:whatsapp' },
  { id: 'threads', label: 'Threads', icon: 'simple-icons:threads' },
  { id: 'bluesky', label: 'Bluesky', icon: 'simple-icons:bluesky' },
  { id: 'mastodon', label: 'Mastodon', icon: 'simple-icons:mastodon' },
  { id: 'reddit', label: 'Reddit', icon: 'simple-icons:reddit' },
  { id: 'twitch', label: 'Twitch', icon: 'simple-icons:twitch' },
  { id: 'dribbble', label: 'Dribbble', icon: 'simple-icons:dribbble' },
  { id: 'behance', label: 'Behance', icon: 'simple-icons:behance' },
  { id: 'medium', label: 'Medium', icon: 'simple-icons:medium' },
  { id: 'devto', label: 'DEV Community', icon: 'simple-icons:devdotto' },
  { id: 'stackoverflow', label: 'Stack Overflow', icon: 'simple-icons:stackoverflow' },
  { id: 'codepen', label: 'CodePen', icon: 'simple-icons:codepen' },
  { id: 'pinterest', label: 'Pinterest', icon: 'simple-icons:pinterest' },
  { id: 'snapchat', label: 'Snapchat', icon: 'simple-icons:snapchat' },
  { id: 'signal', label: 'Signal', icon: 'simple-icons:signal' },
  { id: 'soundcloud', label: 'SoundCloud', icon: 'simple-icons:soundcloud' },
  { id: 'spotify', label: 'Spotify', icon: 'simple-icons:spotify' },
] as const;

export type SocialNetworkId = (typeof socialNetworks)[number]['id'];
export const socialNetworkIds = socialNetworks.map((network) => network.id) as [SocialNetworkId, ...SocialNetworkId[]];

export interface SocialLink {
  platform: SocialNetworkId | `custom:${string}`;
  url: string;
  customLabel?: string;
  customIcon?: string;
}

export function getSocialNetwork(platform: string) {
  return socialNetworks.find((network) => network.id === platform);
}

export function resolveSocialLinks(
  socialLinks: SocialLink[] | null | undefined,
  legacy: { githubUrl?: string | null; linkedinUrl?: string | null },
): SocialLink[] {
  const links = Array.isArray(socialLinks)
    ? socialLinks.filter((link) => (getSocialNetwork(link.platform) || (link.platform.startsWith('custom:') && !!link.customLabel?.trim())) && typeof link.url === 'string' && link.url.length > 0)
    : [];
  for (const [platform, url] of [['github', legacy.githubUrl], ['linkedin', legacy.linkedinUrl]] as const) {
    if (url && !links.some((link) => link.platform === platform)) links.push({ platform, url });
  }
  return links;
}
