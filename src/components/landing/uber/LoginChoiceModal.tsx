import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { ArrowRight, Shield, User, X } from 'lucide-react';
import { GuardrModal } from '../../baseui/overlays/GuardrModal';

const HEADING_FONT = '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif';

interface LoginChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (role: 'guard' | 'client') => void;
}

interface LoginOption {
  role: 'guard' | 'client';
  icon: typeof Shield;
  title: string;
  body: string;
}

const OPTIONS: LoginOption[] = [
  {
    role: 'guard',
    icon: Shield,
    title: 'Guard login',
    body: 'Find everything you need to browse jobs, track shifts, and manage your work.',
  },
  {
    role: 'client',
    icon: User,
    title: 'Client login',
    body: 'Post coverage, manage payments, review job history, and track live shifts.',
  },
];

/** Uber-style "which login?" modal — Guard vs Client, mirroring Driver/Rider. */
export function LoginChoiceModal({ open, onClose, onSelect }: LoginChoiceModalProps) {
  const [, theme] = useStyletron();

  return (
    <GuardrModal
      open={open}
      onClose={onClose}
      align="center"
      ariaLabelledBy="login-choice-title"
      panelClassName="login-choice-panel"
    >
      <Block
        position="relative"
        padding="scale900"
        $style={{ maxWidth: '640px', width: '100%' }}
      >
        <Block
          as="button"
          type="button"
          aria-label="Close"
          onClick={onClose}
          position="absolute"
          top="scale600"
          right="scale600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="36px"
          height="36px"
          $style={{
            border: 'none',
            background: 'transparent',
            color: theme.colors.contentPrimary,
            cursor: 'pointer',
            borderRadius: '50%',
          }}
        >
          <X size={22} />
        </Block>

        <Block as="h2" id="login-choice-title" $style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Choose how to log in
        </Block>

        <Block
          display="grid"
          gridGap="scale800"
          marginTop="scale700"
          $style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          {OPTIONS.map(({ role, icon: Icon, title, body }) => (
            <Block
              key={role}
              as="button"
              type="button"
              onClick={() => onSelect(role)}
              display="flex"
              flexDirection="column"
              alignItems="flex-start"
              gridGap="scale400"
              $style={{
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              <Icon size={24} color={theme.colors.contentPrimary} strokeWidth={1.75} aria-hidden />

              <Block
                width="100%"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gridGap="scale400"
                paddingBottom="scale400"
                $style={{ borderBottom: `1px solid ${theme.colors.borderOpaque}` }}
              >
                <Block
                  as="span"
                  $style={{
                    fontFamily: HEADING_FONT,
                    fontWeight: 700,
                    fontSize: '20px',
                    letterSpacing: '-0.02em',
                    color: theme.colors.contentPrimary,
                  }}
                >
                  {title}
                </Block>
                <ArrowRight size={20} color={theme.colors.contentPrimary} style={{ flexShrink: 0 }} />
              </Block>

              <Block
                as="p"
                margin={0}
                $style={{ fontSize: '14px', lineHeight: 1.5, color: theme.colors.contentSecondary }}
              >
                {body}
              </Block>
            </Block>
          ))}
        </Block>
      </Block>
    </GuardrModal>
  );
}
