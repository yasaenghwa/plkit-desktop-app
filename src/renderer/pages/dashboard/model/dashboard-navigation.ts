export const ROUTE_IDS = [
  'overview',
  'devices',
  'monitoring',
  'control',
  'camera',
  'history',
  'system',
  'assistant',
] as const;

export type RouteId = (typeof ROUTE_IDS)[number];

type NavigationItem = {
  readonly id: RouteId;
  readonly label: string;
  readonly iconPath: string;
};

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { id: 'overview', label: 'Overview', iconPath: 'M3 10.5 12 3l9 7.5V20H15v-7H9v7H3z' },
  { id: 'devices', label: 'Devices', iconPath: 'M4 4h16v16H4z M9 9h6v6H9z' },
  { id: 'monitoring', label: 'Monitoring', iconPath: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'control', label: 'Control', iconPath: 'M4 5h16M7 12h10M10 19h4' },
  {
    id: 'camera',
    label: 'Growth Camera',
    iconPath: 'M4 7h3l2-3h6l2 3h3v13H4z M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  },
  {
    id: 'history',
    label: 'History',
    iconPath: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  },
  {
    id: 'system',
    label: 'System',
    iconPath: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v3 M12 19v3 M2 12h3 M19 12h3',
  },
  {
    id: 'assistant',
    label: 'AI Assistant',
    iconPath: 'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z',
  },
];
