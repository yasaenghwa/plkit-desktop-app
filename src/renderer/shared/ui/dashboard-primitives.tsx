import type { ReactNode } from 'react';

export type StatusTone = 'accent' | 'danger' | 'info' | 'muted' | 'success';

type PanelProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly title?: string;
  readonly action?: ReactNode;
};

export const Panel = ({ action, children, className = '', title }: PanelProps): JSX.Element => (
  <section className={`panel ${className}`.trim()}>
    {title ? (
      <header className="panel__header">
        <h2>{title}</h2>
        {action}
      </header>
    ) : null}
    {children}
  </section>
);

type PageTitleProps = {
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly iconPath?: string;
  readonly subtitle?: string;
};

export const PageTitle = ({ action, children, iconPath, subtitle }: PageTitleProps): JSX.Element => (
  <header className="page-title">
    <div className="page-title__heading">
      {iconPath ? <Icon path={iconPath} size={28} /> : null}
      <div>
        <h1>{children}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
    {action}
  </header>
);

type StatusBadgeProps = {
  readonly label: string;
  readonly pulse?: boolean;
  readonly tone?: StatusTone;
};

export const StatusBadge = ({ label, pulse = false, tone = 'muted' }: StatusBadgeProps): JSX.Element => (
  <span className={`status-badge status-badge--${tone}`}>
    <span aria-hidden="true" className={`status-badge__dot${pulse ? ' pulse' : ''}`} />
    {label}
  </span>
);

type SegmentedControlProps<Option extends string> = {
  readonly active: Option;
  readonly label: string;
  readonly onChange: (option: Option) => void;
  readonly options: readonly Option[];
};

export const SegmentedControl = <Option extends string>({
  active,
  label,
  onChange,
  options,
}: SegmentedControlProps<Option>): JSX.Element => (
  <div aria-label={label} className="segmented-control" role="group">
    {options.map((option) => (
      <button
        aria-pressed={active === option}
        className="segmented-control__button"
        key={option}
        onClick={() => onChange(option)}
        type="button"
      >
        {option}
      </button>
    ))}
  </div>
);

type DataRowsProps = {
  readonly rows: ReadonlyArray<readonly [string, string]>;
};

export const DataRows = ({ rows }: DataRowsProps): JSX.Element => (
  <dl className="data-rows">
    {rows.map(([label, value]) => (
      <div className="data-rows__row" key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ))}
  </dl>
);

type ImageSlotProps = {
  readonly className?: string;
  readonly label: string;
};

export const ImageSlot = ({ className = '', label }: ImageSlotProps): JSX.Element => (
  <div className={`image-slot ${className}`.trim()}>
    <Icon path="M4 5h16v14H4z M7 16l4-5 3 3 2-2 2 4 M16 9h.01" size={24} />
    <span>{label}</span>
  </div>
);

type IconProps = {
  readonly path: string;
  readonly size?: number;
};

export const Icon = ({ path, size = 17 }: IconProps): JSX.Element => (
  <svg aria-hidden="true" height={size} viewBox="0 0 24 24" width={size}>
    <path d={path} />
  </svg>
);

type LineChartProps = {
  readonly label: string;
  readonly points: string;
  readonly variant?: 'history' | 'sensor';
};

export const LineChart = ({ label, points, variant = 'sensor' }: LineChartProps): JSX.Element => (
  <svg
    aria-label={label}
    className={`line-chart line-chart--${variant}`}
    preserveAspectRatio="none"
    role="img"
    viewBox="0 0 720 200"
  >
    {variant === 'history' ? <rect className="line-chart__range" height="75" width="720" x="0" y="55" /> : null}
    <line className="line-chart__grid" x1="0" x2="720" y1="50" y2="50" />
    <line className="line-chart__grid" x1="0" x2="720" y1="100" y2="100" />
    <line className="line-chart__grid" x1="0" x2="720" y1="150" y2="150" />
    <line className="line-chart__baseline" x1="0" x2="720" y1="199" y2="199" />
    {variant === 'history' ? <path className="line-chart__pump" d="M256 0V200" /> : null}
    <polyline className="line-chart__line" points={points} />
  </svg>
);
