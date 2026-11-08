import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { ContatoNaoEncontradoError } from '../contatos/contato.service.js';

const CAMPO_DO_CORPO = 'corpo';

const MENSAGENS_POR_TIPO_DE_ERRO = new Map([
  ['entity.parse.failed', 'JSON malformado'],
  ['entity.too.large', 'Corpo da requisição acima do limite permitido'],
]);

type ErroDeCliente = { status: number; type?: string };

const ehErroDeCliente = (erro: unknown): erro is ErroDeCliente => {
  if (typeof erro !== 'object' || erro === null || !('status' in erro)) {
    return false;
  }
  return typeof erro.status === 'number' && erro.status >= 400 && erro.status < 500;
};

const descreverErroInesperado = (erro: unknown) => ({
  nome: erro instanceof Error ? erro.name : typeof erro,
  codigo: typeof erro === 'object' && erro !== null && 'code' in erro ? erro.code : undefined,
});

const listarErrosDeValidacao = (erro: ZodError) =>
  erro.issues.flatMap((problema) => {
    if (problema.code === 'unrecognized_keys') {
      return problema.keys.map((campo) => ({ campo, mensagem: 'Campo não permitido' }));
    }
    return [{ campo: problema.path.join('.') || CAMPO_DO_CORPO, mensagem: problema.message }];
  });

const mensagemParaCliente = (erro: ErroDeCliente) =>
  MENSAGENS_POR_TIPO_DE_ERRO.get(erro.type ?? '') ?? 'Requisição inválida';

export const rotaNaoEncontrada: RequestHandler = (_req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada' });
};

export const tratarErros: ErrorRequestHandler = (erro: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(erro);
    return;
  }
  if (erro instanceof ZodError) {
    res.status(400).json({ mensagem: 'Dados inválidos', erros: listarErrosDeValidacao(erro) });
    return;
  }
  if (erro instanceof ContatoNaoEncontradoError) {
    res.status(404).json({ mensagem: erro.message });
    return;
  }
  if (ehErroDeCliente(erro)) {
    res.status(erro.status).json({ mensagem: mensagemParaCliente(erro) });
    return;
  }
  console.error('Erro inesperado', descreverErroInesperado(erro));
  res.status(500).json({ mensagem: 'Erro interno' });
};
