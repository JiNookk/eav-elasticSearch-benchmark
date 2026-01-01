import type { Contact } from '../../../domain/contact/contact.domain';

/**
 * Contact Repository Port Interface
 * 애플리케이션 레이어에서 정의하는 추상 인터페이스
 */
export interface ContactRepositoryPort {
  /**
   * ID로 Contact 조회
   */
  findById(id: string): Promise<Contact | null>;

  /**
   * Email로 Contact 조회
   */
  findByEmail(email: string): Promise<Contact | null>;

  /**
   * 모든 Contact 조회
   */
  findAll(): Promise<Contact[]>;

  /**
   * Contact 저장 (생성 또는 수정)
   */
  save(contact: Contact): Promise<void>;

  /**
   * Contact 삭제
   */
  delete(id: string): Promise<void>;
}

export const CONTACT_REPOSITORY = Symbol('CONTACT_REPOSITORY');
