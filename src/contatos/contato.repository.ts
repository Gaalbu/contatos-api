import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import type { Contato, ContatoRepository } from './contato.types.js';

type LinhaContato = Contato & RowDataPacket;

export function criarContatoRepository(pool: Pool): ContatoRepository {
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
      const campos: string[] = [];
      const valores: (string | number)[] = [];
      if (dados.nome !== undefined) {
        campos.push('nome = ?');
        valores.push(dados.nome);
      }
      if (dados.telefone !== undefined) {
        campos.push('telefone = ?');
        valores.push(dados.telefone);
      }
      if (campos.length > 0) {
        await pool.execute(`UPDATE contatos SET ${campos.join(', ')} WHERE id = ?`, [
          ...valores,
          id,
        ]);
      }
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
}
