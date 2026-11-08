import { carregarConfig } from '../config/env.js';
import { aplicarMigracoes } from './migrate.js';
import { criarPool, descreverFalha } from './pool.js';

const migrar = async () => {
  const pool = criarPool(carregarConfig().banco);
  try {
    await aplicarMigracoes(pool);
  } finally {
    await pool.end();
  }
};

migrar().catch((erro: unknown) => {
  console.error(`Não foi possível aplicar as migrações: ${descreverFalha(erro)}`);
  process.exitCode = 1;
});
