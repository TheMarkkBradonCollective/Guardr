import { ArrowRight, Briefcase, Building2, Shield } from 'lucide-react';
import { Block } from 'baseui/block';
import { ParagraphMedium, LabelSmall } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { FormFactor } from '../../lib/platform/device';
import type { AuthViewRole } from '../../lib/appNavigation';
import { GuardrCard } from '../baseui/GuardrCard';
import { AccentIcon } from '../baseui/dashboard';

interface LandingPathCardsProps {
  onNavigateToAuth: (role?: AuthViewRole, mode?: 'sign-in' | 'sign-up') => void;
  layout: FormFactor;
}

export function LandingPathCards({ onNavigateToAuth, layout }: LandingPathCardsProps) {
  const [, theme] = useStyletron();
  const isMobile = layout === 'mobile';

  return (
    <Block
      display="grid"
      gridTemplateColumns={isMobile ? '1fr' : ['1fr', '1fr', '1fr 1fr', '1fr 1fr 1fr']}
      gridGap="scale500"
      width="100%"
    >
      <GuardrCard
        interactive
        onClick={() => onNavigateToAuth('staff', 'sign-up')}
        overrides={{ Root: { style: { cursor: 'pointer', height: '100%' } } }}
      >
        <Block display="flex" justifyContent="space-between" alignItems="flex-start" gridGap="scale400">
          <Block>
            <LabelSmall color="accent" marginBottom="scale200" overrides={{ Block: { style: { fontWeight: 700 } } }}>
              Work at Guardr
            </LabelSmall>
            <Block as="p" margin="0 0 6px" $style={{ fontWeight: 800, fontSize: '18px' }}>
              Apply for a staff role
            </Block>
            <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
              Platform operations — not guard or client marketplace signup.
            </ParagraphMedium>
          </Block>
          <AccentIcon icon={Briefcase} size={22} strokeWidth={1.75} />
        </Block>
        <Block
          display="inline-flex"
          alignItems="center"
          gridGap="scale200"
          marginTop="scale600"
          color="accent"
          $style={{ fontWeight: 700, fontSize: '14px' }}
        >
          Apply as staff <ArrowRight size={14} color={theme.colors.accent} />
        </Block>
      </GuardrCard>

      <GuardrCard
        interactive
        onClick={() => onNavigateToAuth('client', 'sign-up')}
        overrides={{ Root: { style: { cursor: 'pointer', height: '100%' } } }}
      >
        <Block display="flex" justifyContent="space-between" alignItems="flex-start" gridGap="scale400">
          <Block>
            <LabelSmall color="accent" marginBottom="scale200" overrides={{ Block: { style: { fontWeight: 700 } } }}>
              For businesses &amp; sites
            </LabelSmall>
            <Block as="p" margin="0 0 6px" $style={{ fontWeight: 800, fontSize: '18px' }}>
              I need security
            </Block>
            <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
              Post coverage, review guards, monitor live shifts — hire on the marketplace.
            </ParagraphMedium>
          </Block>
          <AccentIcon icon={Building2} size={22} strokeWidth={1.75} />
        </Block>
        <Block
          display="inline-flex"
          alignItems="center"
          gridGap="scale200"
          marginTop="scale600"
          color="accent"
          $style={{ fontWeight: 700, fontSize: '14px' }}
        >
          Get started <ArrowRight size={14} color={theme.colors.accent} />
        </Block>
      </GuardrCard>

      <GuardrCard
        interactive
        onClick={() => onNavigateToAuth('guard', 'sign-up')}
        overrides={{ Root: { style: { cursor: 'pointer', height: '100%' } } }}
      >
        <Block display="flex" justifyContent="space-between" alignItems="flex-start" gridGap="scale400">
          <Block>
            <LabelSmall color="accent" marginBottom="scale200" overrides={{ Block: { style: { fontWeight: 700 } } }}>
              Independent contractor
            </LabelSmall>
            <Block as="p" margin="0 0 6px" $style={{ fontWeight: 800, fontSize: '18px' }}>
              I&apos;m a guard
            </Block>
            <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
              Browse marketplace shifts — not a Guardr employee application.
            </ParagraphMedium>
          </Block>
          <AccentIcon icon={Shield} size={22} strokeWidth={1.75} />
        </Block>
        <Block
          display="inline-flex"
          alignItems="center"
          gridGap="scale200"
          marginTop="scale600"
          color="accent"
          $style={{ fontWeight: 700, fontSize: '14px' }}
        >
          Create account <ArrowRight size={14} color={theme.colors.accent} />
        </Block>
      </GuardrCard>
    </Block>
  );
}
