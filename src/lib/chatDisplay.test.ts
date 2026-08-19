import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  chatSenderLabelForViewer,
  communityChatSenderLabel,
  displaySenderNameForViewer,
  maskReplySenderName,
} from './chatDisplay';
import { CUSTOMER_LABEL } from './audienceLabels';

describe('chatDisplay staff privacy', () => {
  it('hides staff names from clients and guards', () => {
    assert.equal(displaySenderNameForViewer('client', 'moderator', 'Jane Director'), 'Moderator');
    assert.equal(displaySenderNameForViewer('guard', 'administrator', 'Bob Admin'), 'Administrator');
    assert.equal(
      communityChatSenderLabel('guard', 'owner', 'Founder Name', 'Guard'),
      'Guardr · Founder'
    );
    assert.equal(
      communityChatSenderLabel('client', 'director', 'Pat Director', CUSTOMER_LABEL),
      'Guardr · Director'
    );
    assert.equal(chatSenderLabelForViewer('client', 'moderator', 'Jane'), 'Moderator');
  });

  it('shows staff names to staff viewers', () => {
    assert.equal(displaySenderNameForViewer('moderator', 'administrator', 'Bob'), 'Bob');
    assert.equal(
      communityChatSenderLabel('moderator', 'owner', 'Alex', 'Guard'),
      'Guardr · Founder · Alex'
    );
    assert.equal(chatSenderLabelForViewer('administrator', 'moderator', 'Jane'), 'Guardr staff (Jane)');
  });

  it('shows peer names to clients and guards', () => {
    assert.equal(displaySenderNameForViewer('client', 'guard', 'Mike Guard'), 'Mike Guard');
    assert.equal(
      communityChatSenderLabel('guard', 'guard', 'Mike Guard', 'Guard'),
      'Guardr · Guard · Mike Guard'
    );
  });

  it('shows system activation messages as Guardr Staff', () => {
    assert.equal(
      chatSenderLabelForViewer('client', 'administrator', 'Guardr Staff', 'guardr-support'),
      'Guardr Staff'
    );
    assert.equal(
      chatSenderLabelForViewer('administrator', 'administrator', 'Guardr Staff', 'guardr-support'),
      'Guardr Staff'
    );
  });

  it('brands field-test automation as Guardr in staff chat', async () => {
    const { staffChatSenderLabel } = await import('./staffMessenger');
    assert.equal(
      staffChatSenderLabel('owner', 'Staff (Field Test)', 'staff-field-test-guardr'),
      'Guardr'
    );
    assert.equal(staffChatSenderLabel('director', 'Guardr', 'staff-field-test-guardr'), 'Guardr');
  });

  it('masks quoted reply senders when they are staff', () => {
    const thread = [{ senderName: 'Jane Director', senderRole: 'director' as const }];
    assert.equal(maskReplySenderName('client', 'Jane Director', thread), 'Director');
    assert.equal(maskReplySenderName('moderator', 'Jane Director', thread), 'Jane Director');
    assert.equal(maskReplySenderName('guard', 'Guardr staff', thread), 'Staff');
  });
});
