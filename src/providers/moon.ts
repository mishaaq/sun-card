import { HassEntity } from 'home-assistant-js-websocket';

import { IReader, EntityWrapper, ValueProvider } from '../types';

class EmptyReader implements IReader<string> {
  read(): string {
    return '';
  }
}

export const createMoonPhase = (entity?: HassEntity): ValueProvider<string> => {
  if (!entity) {
    return [new EmptyReader(), () => {}];
  }
  const entityReader = new class extends EntityWrapper implements IReader<string> {
    read(): string {
      return this.state();
    }
  }(entity);
  return [entityReader, entityReader.mutator()];
};
