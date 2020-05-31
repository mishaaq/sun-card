import { HassEntity } from 'home-assistant-js-websocket';

import { IReader, EntityWrapper, ValueProvider } from '../types';

const createMoonPhase = (entity: HassEntity): ValueProvider<string> => {
  const entityReader = new (class extends EntityWrapper implements IReader<string> {
    read(): string {
      return this.attr('icon');
    }
  })(entity);
  return [entityReader, entityReader.mutator()];
};

export default createMoonPhase;
