import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import type { Pool, RowDataPacket } from 'mysql2/promise';

import { carregarConfig } from '../config/env.js';
import { criarPool } from './pool.js';

export async function aplicarMigracoes(pool: Pool): Promise<void> {
  await pool.execute(`CREATE TABLE IF NOT EXISTS migracoes (
    nome VARCHAR(255) NOT NULL PRIMARY KEY,
    aplicada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
  const diretorio = new URL('../../db/migrations/', import.meta.url);
  const arquivos = (await readdir(diretorio)).filter((nome) => nome.endsWith('.sql')).sort();
  for (const nome of arquivos) {
    const [aplicadas] = await pool.execute<RowDataPacket[]>(
      'SELECT nome FROM migracoes WHERE nome = ?',
      [nome],
    );
    if (aplicadas.length > 0) continue;
    const sql = await readFile(new URL(nome, diretorio), 'utf8');
    await pool.query(sql);
    await pool.execute('INSERT INTO migracoes (nome) VALUES (?)', [nome]);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pool = criarPool(carregarConfig().banco);
  try {
    await aplicarMigracoes(pool);
  } catch {
    console.error('Não foi possível aplicar as migrações');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
