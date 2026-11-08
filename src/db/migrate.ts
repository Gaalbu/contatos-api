import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

import { carregarConfig } from '../config/env.js';
import { criarPool } from './pool.js';

const NOME_DO_BLOQUEIO = 'contatos_migracoes';
const ESPERA_DO_BLOQUEIO_EM_SEGUNDOS = 60;

const obterBloqueio = async (conexao: PoolConnection): Promise<void> => {
  const [linhas] = await conexao.execute<RowDataPacket[]>('SELECT GET_LOCK(?, ?) AS obtido', [
    NOME_DO_BLOQUEIO,
    ESPERA_DO_BLOQUEIO_EM_SEGUNDOS,
  ]);
  if (linhas[0]?.obtido !== 1) {
    throw Object.assign(new Error('Outra migração está em andamento'), {
      code: 'MIGRACAO_EM_ANDAMENTO',
    });
  }
};

const aplicarPendentes = async (conexao: PoolConnection): Promise<void> => {
  await conexao.execute(`CREATE TABLE IF NOT EXISTS migracoes (
    nome VARCHAR(255) NOT NULL PRIMARY KEY,
    aplicada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
  const diretorio = new URL('../../db/migrations/', import.meta.url);
  const arquivos = (await readdir(diretorio)).filter((nome) => nome.endsWith('.sql')).sort();
  for (const nome of arquivos) {
    const [aplicadas] = await conexao.execute<RowDataPacket[]>(
      'SELECT nome FROM migracoes WHERE nome = ?',
      [nome],
    );
    if (aplicadas.length > 0) continue;
    const sql = await readFile(new URL(nome, diretorio), 'utf8');
    await conexao.query(sql);
    await conexao.execute('INSERT INTO migracoes (nome) VALUES (?)', [nome]);
  }
};

export const aplicarMigracoes = async (pool: Pool): Promise<void> => {
  const conexao = await pool.getConnection();
  try {
    await obterBloqueio(conexao);
    try {
      await aplicarPendentes(conexao);
    } finally {
      await conexao.execute('SELECT RELEASE_LOCK(?)', [NOME_DO_BLOQUEIO]);
    }
  } finally {
    conexao.release();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pool = criarPool(carregarConfig().banco);
  try {
    await aplicarMigracoes(pool);
  } catch (erro) {
    const codigo =
      erro instanceof Error && 'code' in erro && typeof erro.code === 'string'
        ? erro.code
        : 'ERRO_DESCONHECIDO';
    console.error(`Não foi possível aplicar as migrações (${codigo})`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
