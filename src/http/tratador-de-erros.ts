import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { ContatoNaoEncontradoError } from '../contatos/contato.service.js';

const CAMPO_DO_CORPO = 'corpo';

const MENSAGENS_DE_REQUISICAO = new Map<number, string>([
  [413, 'Corpo da requisição acima do limite permitido'],
  [415, 'Formato do corpo não suportado'],
]);

type ErroDeRequisicao = { status: number; type?: string };

const eErroDeRequisicao = (erro: unknown): erro is ErroDeRequisicao => {
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

const mensagemDeRequisicao = (erro: ErroDeRequisicao) =>
  erro.type === 'entity.parse.failed'
    ? 'JSON malformado'
    : (MENSAGENS_DE_REQUISICAO.get(erro.status) ?? 'Requisição inválida');

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
  if (eErroDeRequisicao(erro)) {
    res.status(erro.status).json({ mensagem: mensagemDeRequisicao(erro) });
    return;
  }
  console.error('Erro inesperado', descreverErroInesperado(erro));
  res.status(500).json({ mensagem: 'Erro interno' });
};
