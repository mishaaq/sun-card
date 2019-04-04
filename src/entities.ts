
export class TimeEntity {
  private _entity: any;

  get attributes(): any {
    return this._entity.attributes;
  }

  get time(): Date {
    const stateDate = new Date();
    stateDate.setHours(this._entity.state.split(':')[0]);
    stateDate.setMinutes(this._entity.state.split(':')[1]);
    return stateDate;
  }

  constructor(haEntity: any) {
    this._entity = haEntity;
  }
}
