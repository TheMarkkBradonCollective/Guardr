/**
 * GuardrTabs — Base Web Tabs (motion) wrapper.
 * https://baseweb.design/components/tabs-motion/
 *
 * Base Web pattern: underline active tab on white background.
 */

import React from 'react';
import { Tabs, Tab } from './baseuiShims';
import { useStyletron } from 'baseui';
import { FONT_TEXT } from '../../theme/typography';

export interface GuardrTab {
  key: string;
  title: string;
  badge?: number;
  content: React.ReactNode;
}

interface GuardrTabsProps {
  tabs: GuardrTab[];
  activeKey: string;
  onChange: (key: string) => void;
  fill?: 'intrinsic' | 'fixed';
}

export function GuardrTabs({
  tabs,
  activeKey,
  onChange,
  fill = 'intrinsic',
}: GuardrTabsProps) {
  const [, theme] = useStyletron();

  return (
    <Tabs
      activeKey={activeKey}
      onChange={({ activeKey: k }: { activeKey: React.Key }) => onChange(String(k))}
      fill={fill}
      activateOnFocus
      overrides={{
        Root: {
          style: { backgroundColor: 'transparent' },
        },
        TabList: {
          style: {
            backgroundColor: theme.colors.backgroundPrimary,
            borderBottom: `1px solid ${theme.colors.borderOpaque}`,
            paddingLeft: '0',
            paddingRight: '0',
          },
        },
        TabHighlight: {
          style: {
            backgroundColor: theme.colors.contentPrimary,
            height: '2px',
          },
        },
        TabBorder: {
          style: { display: 'none' },
        },
        TabPanel: {
          style: {
            padding: '0',
            backgroundColor: theme.colors.backgroundPrimary,
          },
        },
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.key}
          title={
            tab.badge != null && tab.badge > 0
              ? `${tab.title} (${tab.badge})`
              : tab.title
          }
          overrides={{
            Tab: {
              style: ({ $active }: { $active?: boolean }) => ({
                fontFamily: FONT_TEXT,
                fontWeight: $active ? 700 : 500,
                fontSize: '14px',
                color: $active ? theme.colors.contentPrimary : theme.colors.contentSecondary,
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '20px',
                paddingRight: '20px',
                background: 'transparent',
                transition: 'color 120ms ease',
                ':hover': {
                  color: theme.colors.contentPrimary,
                  background: 'transparent',
                },
              }),
            },
          }}
        >
          {tab.content}
        </Tab>
      ))}
    </Tabs>
  );
}
