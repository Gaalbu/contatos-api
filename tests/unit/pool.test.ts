import { describe, expect, it } from 'vitest';

import { ConfiguracaoInvalidaError } from '../../src/config/env.js';
import { codigoDoErro, descreverFalha } from '../../src/db/pool.js';

describe('descreverFalha', () => {
  it('mantém a mensagem da configuração inválida, que só traz nomes de variáveis', () => {
    const erro = new ConfiguracaoInvalidaError('Configuração inválida: DB_PORT');

    expect(descreverFalha(erro)).toBe('Configuração inválida: DB_PORT');
  });

  it('reduz as demais falhas ao código', () => {
    const erro = Object.assign(new Error("Access denied for user 'contatos'"), {
      code: 'ER_ACCESS_DENIED_ERROR',
    });

    expect(descreverFalha(erro)).toBe('ER_ACCESS_DENIED_ERROR');
  });
});

describe('codigoDoErro', () => {
  it('devolve o código do erro sem usar a mensagem', () => {
    const erro = Object.assign(new Error("Access denied for user 'contatos'"), {
      code: 'ER_ACCESS_DENIED_ERROR',
    });

    expect(codigoDoErro(erro)).toBe('ER_ACCESS_DENIED_ERROR');
  });

  it.each([
    ['erro sem código', new Error('detalhe interno')],
    ['código que não é texto', Object.assign(new Error('detalhe interno'), { code: 1045 })],
    ['valor que não é erro', 'detalhe interno'],
  ])('usa o código genérico para %s', (_caso, erro) => {
    expect(codigoDoErro(erro)).toBe('ERRO_DESCONHECIDO');
  });
});
