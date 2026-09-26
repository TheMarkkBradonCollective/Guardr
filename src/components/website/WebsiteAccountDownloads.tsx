import React from 'react';
import { AppDownloadScreen } from '../app/AppDownloadScreen';
import { PRODUCT_APP_ICON_LABELS, productAppForRole, type ProductRole } from '../../lib/productApps';

export function WebsiteAccountDownloads({
  role,
  canDownloadApks,
}: {
  role: ProductRole;
  canDownloadApks: boolean;
}) {
  const appLabel = PRODUCT_APP_ICON_LABELS[productAppForRole(role)];

  if (!canDownloadApks) {
    return (
      <div className="website-account-panel" style={{ padding: 20 }}>
        <h1 style={{ fontSize: '1.5rem', letterSpacing: '-0.03em', fontWeight: 750, marginBottom: 8 }}>
          Downloads
        </h1>
        <p className="website-account-lead">
          Android APKs are private until this account is active. Sign up and finish activation on this
          website. After that, {appLabel} and the other Guardr Android apps appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="website-account-panel" style={{ padding: 20 }}>
      <h1 style={{ fontSize: '1.5rem', letterSpacing: '-0.03em', fontWeight: 750, marginBottom: 8 }}>
        Downloads
      </h1>
      <p className="website-account-lead" style={{ marginBottom: 16 }}>
        Android APKs for this active account. Download {appLabel} for this role, or another Guardr APK
        if you need it on a second device.
      </p>
      <AppDownloadScreen embedded accountRole={role} />
    </div>
  );
}
