// The nine social platforms swept by Marriage Mode Advanced.
// ONE editable list (Tiffany to pick Pinterest vs Reddit for slot 9: see rulings list, #12).
export type SocialId = 'instagram' | 'facebook' | 'threads' | 'tiktok' | 'snapchat' | 'x' | 'youtube' | 'linkedin' | 'reddit';
export interface Social { id: SocialId; name: string; profile: (h: string) => string; exportHelp: string; exportHelpEs: string; exportUrl: string;
  /** In-app screens a queue item deep-links to. */ screens: { unfollow: string; removeFollower: string; blockMute: string; groups: string; activity: string } }

const enc = encodeURIComponent;
export const SOCIALS: Social[] = [
  { id: 'instagram', name: 'Instagram', profile: (h) => `https://www.instagram.com/${enc(h)}/`, exportUrl: 'https://accountscenter.instagram.com/info_and_permissions/dyi/',
    exportHelp: 'Accounts Center → Your information and permissions → Download your information → JSON.', exportHelpEs: 'Centro de cuentas → Tu información y permisos → Descargar tu información → JSON.',
    screens: { unfollow: 'https://www.instagram.com/accounts/access_tool/accounts_you_follow', removeFollower: 'https://www.instagram.com/accounts/access_tool/accounts_following_you', blockMute: 'https://www.instagram.com/accounts/blocked_accounts/', groups: 'https://www.instagram.com/accounts/close_friends/', activity: 'https://www.instagram.com/your_activity/interactions/likes' } },
  { id: 'facebook', name: 'Facebook', profile: (h) => `https://www.facebook.com/${enc(h)}`, exportUrl: 'https://accountscenter.facebook.com/info_and_permissions/dyi/',
    exportHelp: 'Accounts Center → Your information and permissions → Download your information → JSON.', exportHelpEs: 'Centro de cuentas → Tu información y permisos → Descargar tu información → JSON.',
    screens: { unfollow: 'https://www.facebook.com/me/following', removeFollower: 'https://www.facebook.com/me/friends', blockMute: 'https://www.facebook.com/settings/?tab=blocking', groups: 'https://www.facebook.com/groups/joins/', activity: 'https://www.facebook.com/me/allactivity' } },
  { id: 'threads', name: 'Threads', profile: (h) => `https://www.threads.net/@${enc(h)}`, exportUrl: 'https://accountscenter.instagram.com/info_and_permissions/dyi/',
    exportHelp: 'Threads is included in your Instagram download (Accounts Center → Download your information).', exportHelpEs: 'Threads viene en tu descarga de Instagram (Centro de cuentas → Descargar tu información).',
    screens: { unfollow: 'https://www.threads.net/', removeFollower: 'https://www.threads.net/', blockMute: 'https://www.threads.net/settings/privacy', groups: 'https://www.threads.net/', activity: 'https://www.threads.net/activity' } },
  { id: 'tiktok', name: 'TikTok', profile: (h) => `https://www.tiktok.com/@${enc(h)}`, exportUrl: 'https://www.tiktok.com/setting/download-your-data',
    exportHelp: 'Settings and privacy → Account → Download your data → JSON.', exportHelpEs: 'Configuración y privacidad → Cuenta → Descargar tus datos → JSON.',
    screens: { unfollow: 'https://www.tiktok.com/following', removeFollower: 'https://www.tiktok.com/', blockMute: 'https://www.tiktok.com/setting/privacy', groups: 'https://www.tiktok.com/', activity: 'https://www.tiktok.com/' } },
  { id: 'snapchat', name: 'Snapchat', profile: (h) => `https://www.snapchat.com/add/${enc(h)}`, exportUrl: 'https://accounts.snapchat.com/accounts/downloadmydata',
    exportHelp: 'accounts.snapchat.com → My Data → Export JSON files.', exportHelpEs: 'accounts.snapchat.com → Mis datos → Exportar archivos JSON.',
    screens: { unfollow: 'https://www.snapchat.com/', removeFollower: 'https://www.snapchat.com/', blockMute: 'https://www.snapchat.com/', groups: 'https://www.snapchat.com/', activity: 'https://www.snapchat.com/' } },
  { id: 'x', name: 'X', profile: (h) => `https://x.com/${enc(h)}`, exportUrl: 'https://x.com/settings/download_your_data',
    exportHelp: 'Settings → Your account → Download an archive of your data.', exportHelpEs: 'Configuración → Tu cuenta → Descargar un archivo de tus datos.',
    screens: { unfollow: 'https://x.com/following', removeFollower: 'https://x.com/followers', blockMute: 'https://x.com/settings/blocked/all', groups: 'https://x.com/i/lists', activity: 'https://x.com/likes' } },
  { id: 'youtube', name: 'YouTube', profile: (h) => `https://www.youtube.com/@${enc(h)}`, exportUrl: 'https://takeout.google.com/',
    exportHelp: 'Google Takeout → select YouTube → Create export.', exportHelpEs: 'Google Takeout → elige YouTube → Crear exportación.',
    screens: { unfollow: 'https://www.youtube.com/feed/channels', removeFollower: 'https://studio.youtube.com/', blockMute: 'https://studio.youtube.com/', groups: 'https://www.youtube.com/feed/channels', activity: 'https://myactivity.google.com/product/youtube' } },
  { id: 'linkedin', name: 'LinkedIn', profile: (h) => `https://www.linkedin.com/in/${enc(h)}/`, exportUrl: 'https://www.linkedin.com/mypreferences/d/download-my-data',
    exportHelp: 'Settings → Data privacy → Get a copy of your data.', exportHelpEs: 'Configuración → Privacidad de datos → Obtener una copia de tus datos.',
    screens: { unfollow: 'https://www.linkedin.com/mynetwork/network-manager/people-follow/following/', removeFollower: 'https://www.linkedin.com/mynetwork/invite-connect/connections/', blockMute: 'https://www.linkedin.com/mypreferences/d/blocking', groups: 'https://www.linkedin.com/groups/', activity: 'https://www.linkedin.com/in/me/recent-activity/all/' } },
  { id: 'reddit', name: 'Reddit', profile: (h) => `https://www.reddit.com/user/${enc(h)}/`, exportUrl: 'https://www.reddit.com/settings/data-request',
    exportHelp: 'Settings → Privacy → Request your data.', exportHelpEs: 'Configuración → Privacidad → Solicitar tus datos.',
    screens: { unfollow: 'https://www.reddit.com/subreddits/mine', removeFollower: 'https://www.reddit.com/settings/', blockMute: 'https://www.reddit.com/settings/privacy', groups: 'https://www.reddit.com/subreddits/mine', activity: 'https://www.reddit.com/user/me/upvoted/' } },
];
export const SOCIAL = Object.fromEntries(SOCIALS.map((s) => [s.id, s])) as Record<SocialId, Social>;
