import { createPool, type Pool } from 'mysql2/promise';

import type { ConfigBanco } from '../config/env.js';

export function criarPool(banco: ConfigBanco): Pool {
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
    queueLimit: 20,
    connectTimeout: 10000,
  });
}
