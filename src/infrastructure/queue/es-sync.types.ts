import { ContactPayloadData } from '../../domain/contact/contact.domain';

/**
 * ES 동기화 이벤트 타입
 */
export const ES_SYNC_QUEUE = 'es-sync';

export type EsSyncEventType =
  | 'CONTACT_CREATED'
  | 'CONTACT_UPDATED'
  | 'CONTACT_DELETED';

export interface EsSyncJobData {
  type: EsSyncEventType;
  contactId: string;
  payload?: ContactPayloadData;
  timestamp: Date;
}

/**
 * @deprecated ContactPayloadData를 직접 사용하세요
 */
export type ContactPayload = ContactPayloadData;
