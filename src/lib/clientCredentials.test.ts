import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Client } from '../types';
import {
  CLIENT_CREDENTIAL_CATALOG,
  clientCredentialRequiredForJob,
  formatClientCredentialRequiredFor,
  resolveClientCredentialCatalog,
  upsertClientCredentialRuleOverride,
} from './clientCredentialCatalog.ts';
import {
  clientJobCredentialBlocker,
  missingRequiredClientCredentials,
  parseClientCredentials,
  parseClientCredentialFeedItemId,
  submitClientCredentialUpload,
  upsertClientCredential,
} from './clientCredentials.ts';

function personalClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c-personal',
    name: 'Alex Rivera',
    email: 'alex@test.com',
    companyName: '',
    clientType: 'personal',
    phone: '555-0100',
    avatar: '',
    totalRequests: 0,
    credentials: [],
    ...overrides,
  } as Client;
}

function businessClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c-business',
    name: 'Pat Owner',
    email: 'pat@biz.test',
    companyName: 'Harbor Nightlife LLC',
    clientType: 'business',
    phone: '555-0101',
    avatar: '',
    totalRequests: 0,
    credentials: [],
    ...overrides,
  } as Client;
}

describe('clientCredentialCatalog', () => {
  it('keeps government IDs always required and alcohol licenses service-dependent', () => {
    const personalId = CLIENT_CREDENTIAL_CATALOG.find((type) => type.id === 'personal-gov-id');
    const businessId = CLIENT_CREDENTIAL_CATALOG.find((type) => type.id === 'business-rep-gov-id');
    const alcohol = CLIENT_CREDENTIAL_CATALOG.find((type) => type.id === 'business-alcohol-license');
    const sellers = CLIENT_CREDENTIAL_CATALOG.find((type) => type.id === 'business-sellers-permit');

    assert.equal(personalId?.alwaysRequired, true);
    assert.equal(businessId?.alwaysRequired, true);
    assert.equal(alcohol?.alwaysRequired, undefined);
    assert.equal(clientCredentialRequiredForJob(alcohol!, 'nightclub-bar'), true);
    assert.equal(clientCredentialRequiredForJob(alcohol!, 'foot-patrol'), false);
    assert.equal(clientCredentialRequiredForJob(sellers!, 'nightclub-bar'), false);
    assert.match(formatClientCredentialRequiredFor(alcohol!), /alcohol-serving/i);
  });

  it('lets administrators override required-for without changing the catalog ids', () => {
    const rules = upsertClientCredentialRuleOverride([], {
      typeId: 'business-alcohol-license',
      requiredFor: ['event-concert'],
      requiredForDescription: 'Required for concerts serving alcohol',
    });
    const resolved = resolveClientCredentialCatalog(rules).find((type) => type.id === 'business-alcohol-license');
    assert.deepEqual(resolved?.requiredFor, ['event-concert']);
    assert.equal(resolved?.requiredForDescription, 'Required for concerts serving alcohol');
  });
});

describe('clientCredentials', () => {
  it('requires personal government ID even when no job type is selected', () => {
    const missing = missingRequiredClientCredentials(personalClient(), undefined);
    assert.ok(missing.some((type) => type.id === 'personal-gov-id'));
    assert.ok(!missing.some((type) => type.id === 'personal-alcohol-permit'));
  });

  it('requires a business alcohol license only for alcohol-serving jobs', () => {
    const client = businessClient();
    assert.equal(missingRequiredClientCredentials(client, 'foot-patrol').some((t) => t.id === 'business-alcohol-license'), false);
    assert.equal(missingRequiredClientCredentials(client, 'nightclub-bar').some((t) => t.id === 'business-alcohol-license'), true);
    assert.match(clientJobCredentialBlocker(client, 'nightclub-bar') ?? '', /Alcohol License/);
    assert.match(clientJobCredentialBlocker(client, 'foot-patrol') ?? '', /Government-issued ID/);
    assert.doesNotMatch(clientJobCredentialBlocker(client, 'foot-patrol') ?? '', /Alcohol License/);
  });

  it('clears the job blocker after a required credential is verified', () => {
    const uploaded = submitClientCredentialUpload({
      typeId: 'business-rep-gov-id',
      documentUrl: 'id.jpg',
    });
    uploaded.status = 'verified';
    const alcohol = submitClientCredentialUpload({
      typeId: 'business-alcohol-license',
      documentUrl: 'alcohol.jpg',
    });
    alcohol.status = 'verified';
    const client = businessClient({ credentials: [uploaded, alcohol] });
    assert.equal(clientJobCredentialBlocker(client, 'nightclub-bar'), null);
  });

  it('parses stored JSON credentials and feed item ids', () => {
    const parsed = parseClientCredentials([
      { id: 'cc-1', typeId: 'personal-gov-id', status: 'pending', documentUrl: 'id.jpg' },
      { typeId: 'not-a-real-type', status: 'pending' },
    ]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0]?.typeId, 'personal-gov-id');
    const next = upsertClientCredential(parsed, submitClientCredentialUpload({
      typeId: 'personal-drivers-license',
      documentUrl: 'dl.jpg',
    }));
    assert.equal(next.length, 2);
    const parsedId = parseClientCredentialFeedItemId('client-slot/c-1/personal-gov-id');
    assert.deepEqual(parsedId, { clientId: 'c-1', typeId: 'personal-gov-id' });
  });
});
