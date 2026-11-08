import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { carregarConfig } from '../../src/config/env.js';

const ambiente = {
  PORT: '3001',
  DB_HOST: '127.0.0.1',
  DB_PORT: '3307',
  DB_USER: 'contatos',
  DB_PASSWORD: 'senha de teste',
  DB_NAME: 'contatos_test',
};

beforeEach(() => {
  for (const [variavel, valor] of Object.entries(ambiente)) vi.stubEnv(variavel, valor);
});

afterEach(() => vi.unstubAllEnvs());

describe('carregarConfig', () => {
  it('converte as portas e preserva a senha', () => {
    expect(carregarConfig()).toEqual({
      porta: 3001,
      banco: {
        host: '127.0.0.1',
        porta: 3307,
        usuario: 'contatos',
        senha: 'senha de teste',
        nome: 'contatos_test',
      },
    });
  });

  it.each(
    Object.keys(ambiente).flatMap((variavel) => [
      ...(variavel === 'DB_PASSWORD' ? [] : [{ variavel, valor: '' }]),
      { variavel, valor: undefined },
    ]),
  )('identifica $variavel com valor $valor sem expor credenciais', ({ variavel, valor }) => {
    vi.stubEnv(variavel, valor);
    expect(carregarConfig).toThrow(variavel);
    expect(carregarConfig).not.toThrow(ambiente.DB_PASSWORD);
  });

  it('aceita senha explicitamente vazia para instalações locais sem autenticação', () => {
    vi.stubEnv('DB_PASSWORD', '');
    expect(carregarConfig().banco.senha).toBe('');
  });

  it.each(['0', '-1', '65536', '1.5', '1e3', '0x10', 'abc', ' 3000 '])(
    'recusa a porta inválida %s',
    (porta) => {
      vi.stubEnv('PORT', porta);
      vi.stubEnv('DB_PORT', porta);
      expect(carregarConfig).toThrow('PORT, DB_PORT');
    },
  );

  it.each(['DB_HOST', 'DB_USER', 'DB_NAME'])('recusa espaços em %s', (variavel) => {
    vi.stubEnv(variavel, '   ');
    expect(carregarConfig).toThrow(variavel);
  });

  it('não expõe valores inválidos na mensagem de erro', () => {
    vi.stubEnv('DB_PORT', 'credencial-sensivel');
    expect(carregarConfig).toThrow('DB_PORT');
    expect(carregarConfig).not.toThrow('credencial-sensivel');
  });
});
