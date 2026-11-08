import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { criarApp } from '../../src/app.js';
import type { ContatoRepository } from '../../src/contatos/contato.types.js';

const DADO_PESSOAL = 'Ana Souza 91988887777';

const falhaDoBanco = Object.assign(new Error(`Falha ao gravar ${DADO_PESSOAL}`), {
  code: 'ER_DATA_TOO_LONG',
  sql: `INSERT INTO contatos VALUES ('${DADO_PESSOAL}')`,
});

const rejeitar = () => Promise.reject(falhaDoBanco);

const repositorioComFalha: ContatoRepository = {
  criar: rejeitar,
  listar: rejeitar,
  atualizar: rejeitar,
  excluir: rejeitar,
};

describe('erro inesperado', () => {
  const app = criarApp(repositorioComFalha);
  let registroDeErro: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    registroDeErro = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('responde 500 sem detalhes técnicos', async () => {
    const resposta = await request(app).get('/contatos');

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ mensagem: 'Erro interno' });
  });

  it('não registra dados pessoais em log', async () => {
    await request(app).post('/contatos').send({ nome: 'Ana Souza', telefone: '91988887777' });

    const registrado = JSON.stringify(registroDeErro.mock.calls);
    expect(registroDeErro).toHaveBeenCalledOnce();
    expect(registrado).toContain('ER_DATA_TOO_LONG');
    expect(registrado).not.toContain('Ana Souza');
    expect(registrado).not.toContain('91988887777');
  });
});
