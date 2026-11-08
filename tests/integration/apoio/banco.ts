import { carregarConfig, type ConfigBanco } from '../../../src/config/env.js';
import { criarPool } from '../../../src/db/pool.js';

const BANCO_DE_TESTE = 'contatos_test';

export const configBancoTeste = (): ConfigBanco => ({
  ...carregarConfig().banco,
  nome: BANCO_DE_TESTE,
});

export const criarPoolTeste = () => {
  return criarPool(configBancoTeste());
};
