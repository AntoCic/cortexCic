import {
  toast as hotToast,
  type ToastOptions as HotToastOptions,
} from 'react-hot-toast';

export interface ToastOptions extends HotToastOptions {
  subtitle?: string;
}

function renderWithSubtitle(title: string, subtitle: string, options?: HotToastOptions) {
  return hotToast.custom(
    (t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '12px',
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1)',
          padding: '12px 16px',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: 360,
          fontFamily: 'var(--font-body)',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 4,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--gradient-primary)',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--text)',
              lineHeight: 1.3,
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>
            {subtitle}
          </span>
        </div>
      </div>
    ),
    options,
  );
}

function call(
  fn: (msg: string, opts?: HotToastOptions) => string,
  title: string,
  options?: ToastOptions,
): string {
  const { subtitle, ...rest } = options ?? {};
  if (subtitle) return renderWithSubtitle(title, subtitle, rest);
  return fn(title, rest);
}

export const toast = {
  success: (title: string, options?: ToastOptions) => call(hotToast.success, title, options),
  error:   (title: string, options?: ToastOptions) => call(hotToast.error,   title, options),
  loading: (title: string, options?: ToastOptions) => call(hotToast.loading, title, options),
  dismiss: (id?: string) => hotToast.dismiss(id),
} as const;
