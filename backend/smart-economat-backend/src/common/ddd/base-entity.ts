export abstract class DomainEntity<ID = string> {
  readonly id: ID;

  protected constructor(id: ID) {
    this.id = id;
  }
}
