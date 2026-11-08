import express, { type Express } from 'express';

import { criarContatoRouter } from './contatos/contato.routes.js';
import { criarContatoService } from './contatos/contato.service.js';
import type { ContatoRepository } from './contatos/contato.types.js';
import { rotaNaoEncontrada, tratarErros } from './http/tratador-de-erros.js';

export const criarApp = (contatos: ContatoRepository): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/contatos', criarContatoRouter(criarContatoService(contatos)));
  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
};
