import { ProfileAvatar } from '../profile/ProfileAvatar';

interface MobileDrawerIdentityProps {
  userName: string;
  avatarUrl?: string;
  onClick?: () => void;
}

/** Uber-style drawer header — avatar + display name. */
export function MobileDrawerIdentity({ userName, avatarUrl, onClick }: MobileDrawerIdentityProps) {
  const content = (
    <>
      <ProfileAvatar name={userName} src={avatarUrl} size="sm" className="mobility-drawer-identity-avatar shrink-0" />
      <span className="mobility-drawer-identity-name">{userName}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="mobility-drawer-identity" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className="mobility-drawer-identity">{content}</div>;
}
