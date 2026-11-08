import { createPool, type Pool } from 'mysql2/promise';

import { ConfiguracaoInvalidaError, type ConfigBanco } from '../config/env.js';

export const codigoDoErro = (erro: unknown): string =>
  erro instanceof Error && 'code' in erro && typeof erro.code === 'string'
    ? erro.code
    : 'ERRO_DESCONHECIDO';

export const descreverFalha = (erro: unknown): string =>
  erro instanceof ConfiguracaoInvalidaError ? erro.message : codigoDoErro(erro);

export const criarPool = (banco: ConfigBanco): Pool => {
  return createPool({
    host: banco.host,
    port: banco.porta,
    user: banco.usuario,
    password: banco.senha,
    database: banco.nome,
    charset: 'utf8mb4',
    timezone: 'Z',
    connectionLimit: 10,
    waitForConnections: true,
    connectTimeout: 10000,
  });
};
