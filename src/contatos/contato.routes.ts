import { Router } from 'express';

import {
  alteracaoContatoSchema,
  novoContatoSchema,
  parametrosContatoSchema,
} from './contato.schema.js';
import type { ContatoService } from './contato.service.js';

export const criarContatoRouter = (service: ContatoService): Router => {
  const router = Router();

  router.post('/', async (req, res) => {
    const dados = novoContatoSchema.parse(req.body);
    const contato = await service.criar(dados);
    res.status(201).location(`/contatos/${contato.id}`).json(contato);
  });

  router.get('/', async (_req, res) => {
    res.json(await service.listar());
  });

  router.patch('/:id', async (req, res) => {
    const { id } = parametrosContatoSchema.parse(req.params);
    const dados = alteracaoContatoSchema.parse(req.body);
    res.json(await service.atualizar(id, dados));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = parametrosContatoSchema.parse(req.params);
    await service.excluir(id);
    res.status(204).end();
  });

  return router;
};
