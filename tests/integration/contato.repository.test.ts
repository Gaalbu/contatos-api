import type { Pool } from 'mysql2/promise';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { criarContatoRepository } from '../../src/contatos/contato.repository.js';
import type { ContatoRepository } from '../../src/contatos/contato.types.js';
import { aplicarMigracoes } from '../../src/db/migrate.js';
import { criarPoolTeste } from './apoio/banco.js';

let pool: Pool;
let contatos: ContatoRepository;
const dados = { nome: 'Ana Souza', telefone: '91988887777' };

beforeAll(async () => {
  pool = criarPoolTeste();
  await aplicarMigracoes(pool);
  contatos = criarContatoRepository(pool);
});

beforeEach(async () => {
  await pool.execute('DELETE FROM contatos');
});

afterAll(async () => {
  if (pool) {
    await pool.execute('DELETE FROM contatos');
    await pool.end();
  }
});

describe('ContatoRepository com MySQL', () => {
  it('cria e devolve somente id, nome e telefone', async () => {
    const contato = await contatos.criar(dados);
    expect(contato).toEqual({ id: expect.any(Number), ...dados });
    expect(contato.id).toBeGreaterThan(0);
    expect(await contatos.listar()).toEqual([contato]);
  });

  it('devolve lista vazia quando não há contatos', async () => {
    expect(await contatos.listar()).toEqual([]);
  });

  it('lista em ordem crescente de id e permite telefones repetidos', async () => {
    const primeiro = await contatos.criar({ ...dados, nome: 'Zélia Souza' });
    const segundo = await contatos.criar({ ...dados, nome: 'Ana Souza' });
    expect(await contatos.listar()).toEqual([primeiro, segundo]);
    expect(segundo.id).toBeGreaterThan(primeiro.id);
  });

  it('aguarda conexões disponíveis em um pico de cem criações simultâneas', async () => {
    const resultados = await Promise.allSettled(
      Array.from({ length: 100 }, () => contatos.criar(dados)),
    );
    expect(resultados.filter((resultado) => resultado.status === 'rejected')).toEqual([]);
    const criados = await contatos.listar();
    expect(criados).toHaveLength(100);
    expect(new Set(criados.map((contato) => contato.id)).size).toBe(100);
  });

  it('altera o nome sem mudar o telefone', async () => {
    const contato = await contatos.criar(dados);
    expect(await contatos.atualizar(contato.id, { nome: 'José Araújo' })).toEqual({
      ...contato,
      nome: 'José Araújo',
    });
  });

  it('altera o telefone sem mudar o nome', async () => {
    const contato = await contatos.criar(dados);
    expect(await contatos.atualizar(contato.id, { telefone: '9133334444' })).toEqual({
      ...contato,
      telefone: '9133334444',
    });
  });

  it('altera os dois campos e persiste a alteração', async () => {
    const contato = await contatos.criar(dados);
    const novos = { nome: 'Maria-Clara Souza', telefone: '91977776666' };
    expect(await contatos.atualizar(contato.id, novos)).toEqual({ id: contato.id, ...novos });
    expect(await contatos.listar()).toEqual([{ id: contato.id, ...novos }]);
  });

  it('devolve o contato ao atualizar com os mesmos valores', async () => {
    const contato = await contatos.criar(dados);
    expect(await contatos.atualizar(contato.id, dados)).toEqual(contato);
    expect(await contatos.atualizar(contato.id, { nome: dados.nome })).toEqual(contato);
  });

  it('devolve a própria alteração em atualizações simultâneas', async () => {
    const contato = await contatos.criar(dados);
    const nomes = Array.from({ length: 20 }, (_, indice) => `Contato Numero${indice}`);

    const atualizados = await Promise.all(
      nomes.map((nome) => contatos.atualizar(contato.id, { nome })),
    );

    expect(atualizados.map((atualizado) => atualizado?.nome)).toEqual(nomes);
  });

  it('mantém o contato e libera as conexões quando o banco recusa a alteração', async () => {
    const contato = await contatos.criar(dados);

    const resultados = await Promise.allSettled(
      Array.from({ length: 15 }, () => contatos.atualizar(contato.id, { telefone: '123' })),
    );

    expect(resultados.every((resultado) => resultado.status === 'rejected')).toBe(true);
    expect(await contatos.listar()).toEqual([contato]);
  });

  it('devolve null ao atualizar id inexistente', async () => {
    expect(await contatos.atualizar(4294967295, { nome: 'José Araújo' })).toBeNull();
  });

  it('tolera a alteração vazia permitida pelo tipo do repositório', async () => {
    const contato = await contatos.criar(dados);
    expect(await contatos.atualizar(contato.id, {})).toEqual(contato);
    expect(await contatos.atualizar(4294967295, {})).toBeNull();
  });

  it('exclui o contato e retorna false na segunda exclusão', async () => {
    const contato = await contatos.criar(dados);
    expect(await contatos.excluir(contato.id)).toBe(true);
    expect(await contatos.listar()).toEqual([]);
    expect(await contatos.excluir(contato.id)).toBe(false);
  });

  it('retorna false ao excluir id inexistente', async () => {
    expect(await contatos.excluir(4294967295)).toBe(false);
  });

  it('preserva acentos, apóstrofos e caracteres utf8mb4', async () => {
    const contato = await contatos.criar({ ...dados, nome: "José Sant'Ana 𠮷野" });
    expect(await contatos.listar()).toEqual([contato]);
  });

  it('trata a tentativa de injeção como texto na criação e na alteração', async () => {
    const nome = "Robert'); DROP TABLE contatos; -- Silva";
    const criado = await contatos.criar({ ...dados, nome });
    expect(await contatos.listar()).toEqual([criado]);
    expect(await contatos.atualizar(criado.id, { nome })).toEqual(criado);
    expect(await contatos.criar(dados)).toEqual({ id: expect.any(Number), ...dados });
  });

  it('não transforma propriedades extras em colunas SQL', async () => {
    const contato = await contatos.criar(dados);
    const alteracao = { nome: 'José Araújo', 'nome = NULL; DROP TABLE contatos': 'ataque' };
    expect(await contatos.atualizar(contato.id, alteracao)).toEqual({
      ...contato,
      nome: alteracao.nome,
    });
  });

  it('propaga a violação do CHECK sem devolver um contato', async () => {
    await expect(contatos.criar({ ...dados, telefone: '000' })).rejects.toMatchObject({
      code: 'ER_CHECK_CONSTRAINT_VIOLATED',
    });
    expect(await contatos.listar()).toEqual([]);
  });
});
