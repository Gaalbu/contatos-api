import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import type { Contato, ContatoRepository } from './contato.types.js';

type LinhaContato = Contato & RowDataPacket;

export const criarContatoRepository = (pool: Pool): ContatoRepository => {
  return {
    async criar(dados) {
      const [resultado] = await pool.execute<ResultSetHeader>(
        'INSERT INTO contatos (nome, telefone) VALUES (?, ?)',
        [dados.nome, dados.telefone],
      );
      return { id: resultado.insertId, nome: dados.nome, telefone: dados.telefone };
    },
    async listar() {
      const [contatos] = await pool.execute<LinhaContato[]>(
        'SELECT id, nome, telefone FROM contatos ORDER BY id',
      );
      return contatos;
    },
    async atualizar(id, dados) {
      await pool.execute(
        'UPDATE contatos SET nome = COALESCE(?, nome), telefone = COALESCE(?, telefone) WHERE id = ?',
        [dados.nome ?? null, dados.telefone ?? null, id],
      );
      const [contatos] = await pool.execute<LinhaContato[]>(
        'SELECT id, nome, telefone FROM contatos WHERE id = ?',
        [id],
      );
      return contatos[0] ?? null;
    },
    async excluir(id) {
      const [resultado] = await pool.execute<ResultSetHeader>('DELETE FROM contatos WHERE id = ?', [
        id,
      ]);
      return resultado.affectedRows > 0;
    },
  };
};
