import type { Pool } from 'mysql2/promise';

import type { ContatoRepository } from './contato.types.js';

export const criarContatoRepository: (pool: Pool) => ContatoRepository = () => {
  throw new Error('Não implementado');
};
