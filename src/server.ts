import type { Express } from 'express';
import type { Server } from 'node:http';

import { criarApp } from './app.js';
import { carregarConfig } from './config/env.js';
import { criarContatoRepository } from './contatos/contato.repository.js';
import { criarPool, descreverFalha } from './db/pool.js';

const escutar = (app: Express, porta: number) =>
  new Promise<Server>((resolve, reject) => {
    const servidor = app.listen(porta, (erro) => {
      if (erro) {
        reject(erro);
        return;
      }
      resolve(servidor);
    });
  });

const iniciar = async () => {
  const config = carregarConfig();
  const pool = criarPool(config.banco);

  try {
    await pool.query('SELECT 1');
    const app = criarApp(criarContatoRepository(pool));
    const servidor = await escutar(app, config.porta);
    console.info(`API disponível em http://localhost:${config.porta}`);

    const desligar = () => {
      servidor.close(() => void pool.end());
    };
    process.once('SIGTERM', desligar);
    process.once('SIGINT', desligar);
  } catch (erro) {
    await pool.end();
    throw erro;
  }
};

iniciar().catch((erro: unknown) => {
  console.error(`Falha ao iniciar a API: ${descreverFalha(erro)}`);
  process.exitCode = 1;
});
