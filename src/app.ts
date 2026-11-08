import type { Express } from 'express';

import type { ContatoRepository } from './contatos/contato.types.js';

export const criarApp: (contatos: ContatoRepository) => Express = () => {
  throw new Error('Não implementado');
};
