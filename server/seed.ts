import type { RequestRecord } from '../shared/model';

export function seedRequests(): RequestRecord[] {
  return [
    {
      id: 'demo-analytics', ownerId: 'alex', formVersion: 1, revision: 1, status: 'in_review',
      data: { requestTitle: 'Analytics access for quarterly planning', requestType: 'software', application: 'analytics', accessDays: 90, reason: 'Prepare the quarterly operations report with the analytics team.' },
      attachments: [], createdAt: '2026-10-07T03:00:00.000Z', updatedAt: '2026-10-08T04:00:00.000Z',
      audit: [
        { at: '2026-10-07T03:00:00.000Z', actorId: 'alex', action: 'submitted' },
        { at: '2026-10-08T04:00:00.000Z', actorId: 'morgan', action: 'in_review' },
      ],
    },
    {
      id: 'demo-monitor', ownerId: 'sam', formVersion: 1, revision: 1, status: 'approved',
      data: { requestTitle: 'Monitor for the sales workspace', requestType: 'equipment', equipment: 'monitor', quantity: 1, reason: 'A second monitor is needed to prepare customer presentations.' },
      attachments: [], createdAt: '2026-10-06T03:00:00.000Z', updatedAt: '2026-10-07T06:00:00.000Z',
      audit: [
        { at: '2026-10-06T03:00:00.000Z', actorId: 'sam', action: 'submitted' },
        { at: '2026-10-07T06:00:00.000Z', actorId: 'morgan', action: 'approved' },
      ],
    },
  ];
}
