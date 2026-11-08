import { carregarConfig, type ConfigBanco } from '../../../src/config/env.js';
import { criarPool } from '../../../src/db/pool.js';

export function configBancoTeste(): ConfigBanco {
  const banco = {
    ...carregarConfig().banco,
    nome: process.env.TEST_DB_NAME ?? 'contatos_test',
  };
  if (!banco.nome.endsWith('_test')) {
    throw new Error('Testes exigem um banco terminado em _test');
  }
  return banco;
}

export function criarPoolTeste() {
  return criarPool(configBancoTeste());
}
