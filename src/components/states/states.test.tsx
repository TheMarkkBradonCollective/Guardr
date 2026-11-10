import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RestrictedState } from './StateViews.tsx';

describe('state compositions', () => {
  it('uses a different composition on phone, tablet, and desktop', () => {
    const html = {
      mobile: renderToStaticMarkup(
        <RestrictedState surface="mobile" title="Management" message="This section is limited." audience={['Managers']} />,
      ),
      tablet: renderToStaticMarkup(
        <RestrictedState surface="tablet" title="Management" message="This section is limited." audience={['Managers']} />,
      ),
      desktop: renderToStaticMarkup(
        <RestrictedState surface="desktop" title="Management" message="This section is limited." audience={['Managers']} />,
      ),
    };
    assert.match(html.mobile, /data-composition="sheet"/);
    assert.match(html.tablet, /data-composition="rail-card"/);
    assert.match(html.desktop, /data-composition="workbench"/);
    assert.equal(new Set(Object.values(html)).size, 3);
  });

  it('lists who can open a restricted section without fake buttons', () => {
    const html = renderToStaticMarkup(
      <RestrictedState
        surface="desktop"
        title="Management"
        message="Your role cannot open this section."
        audience={['Managers', 'Directors', 'Founders']}
      />,
    );
    assert.equal(html.includes('<button'), false);
    assert.match(html, /Managers/);
    assert.match(html, /Directors/);
    assert.match(html, /Founders/);
  });

  it('renders a button only when the state has a real action', () => {
    const html = renderToStaticMarkup(
      <RestrictedState
        surface="mobile"
        title="Session"
        message="Sign in again to continue."
        action={{ label: 'Sign in', onClick: () => undefined }}
      />,
    );
    assert.match(html, /<button[^>]*>Sign in<\/button>/);
  });
});
