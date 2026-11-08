import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { aplicarMigracoes } from '../../src/db/migrate.js';
import { configBancoTeste, criarPoolTeste } from './apoio/banco.js';

let pool: Pool;

beforeAll(async () => {
  pool = criarPoolTeste();
  await aplicarMigracoes(pool);
});

afterAll(async () => pool?.end());
afterEach(() => vi.unstubAllEnvs());

describe('banco de testes', () => {
  it('usa contatos_test por padrão', () => {
    vi.stubEnv('TEST_DB_NAME', undefined);
    expect(configBancoTeste().nome).toBe('contatos_test');
  });

  it.each(['contatos', 'contatos_test_backup', '', 'mysql'])('recusa o banco %s', (nome) => {
    vi.stubEnv('TEST_DB_NAME', nome);
    expect(criarPoolTeste).toThrow('Testes exigem um banco terminado em _test');
  });

  it('mantém utf8mb4 e interpreta datas como UTC', async () => {
    const [linhas] = await pool.execute<RowDataPacket[]>(
      "SELECT @@character_set_connection AS charset, CAST('2026-11-08 12:00:00' AS DATETIME) AS data",
    );
    expect(linhas[0]?.charset).toBe('utf8mb4');
    expect(linhas[0]?.data).toEqual(new Date('2026-11-08T12:00:00Z'));
  });

  it('serializa aplicações simultâneas das migrações', async () => {
    await pool.query('DROP TABLE IF EXISTS contatos, migracoes');

    await Promise.all(Array.from({ length: 4 }, () => aplicarMigracoes(pool)));

    const [aplicadas] = await pool.execute<RowDataPacket[]>('SELECT nome FROM migracoes');
    expect(aplicadas).toEqual([{ nome: '001_criar_contatos.sql' }]);
  });

  it('reaplica as migrações sem duplicar registros nem perder dados', async () => {
    const [insercao] = await pool.execute<ResultSetHeader>(
      'INSERT INTO contatos (nome, telefone) VALUES (?, ?)',
      ['José Araújo', '91988887777'],
    );
    const [antes] = await pool.execute<RowDataPacket[]>('SELECT nome, aplicada_em FROM migracoes');
    expect(antes).toHaveLength(1);
    expect(antes[0]?.nome).toBe('001_criar_contatos.sql');
    await aplicarMigracoes(pool);
    await aplicarMigracoes(pool);
    const [depois] = await pool.execute<RowDataPacket[]>('SELECT nome, aplicada_em FROM migracoes');
    expect(depois).toEqual(antes);
    const [contatos] = await pool.execute<RowDataPacket[]>(
      'SELECT nome, telefone FROM contatos WHERE id = ?',
      [insercao.insertId],
    );
    expect(contatos).toEqual([{ nome: 'José Araújo', telefone: '91988887777' }]);
    await pool.execute('DELETE FROM contatos WHERE id = ?', [insercao.insertId]);
  });
});
