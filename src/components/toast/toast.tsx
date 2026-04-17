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
          flexDirection: 'column',
          opacity: t.visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          padding: '8px 12px',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: 320,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{subtitle}</span>
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
