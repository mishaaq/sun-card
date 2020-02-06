import { HassEntity } from 'home-assistant-js-websocket';

import { IReader, EntityReader } from '../types';

class EmptyReader implements IReader<string> {
  read(): string {
    return '';
  }
}

export const prepareMoonPhaseReader = (entity?: HassEntity): IReader<string> => {
  if (!entity) return new EmptyReader();
  return new class extends EntityReader implements IReader<string> {
    read(): string {
      return this.state();
    }
  }(entity);
};

export const prepareMoonIconReader = (entity?: HassEntity): IReader<string> => {
  if (!entity) return new EmptyReader();
  return new class extends EntityReader implements IReader<string> {
    read(): string {
      return this.attr('icon');
    }
  }(entity);
};
