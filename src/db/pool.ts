import type { Pool } from 'mysql2/promise';

import type { ConfigBanco } from '../config/env.js';

export const criarPool: (banco: ConfigBanco) => Pool = () => {
  throw new Error('Não implementado');
};
