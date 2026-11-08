import { criarContatoRepository } from '../../../src/contatos/contato.repository.js';
import type { Contato, ContatoRepository } from '../../../src/contatos/contato.types.js';
import { aplicarMigracoes } from '../../../src/db/migrate.js';
import { criarPoolTeste } from '../../integration/apoio/banco.js';

export type RepositorioDeTeste = {
  repositorio: ContatoRepository;
  limpar(): Promise<void>;
  encerrar(): Promise<void>;
};

const criarRepositorioEmMemoria = (): RepositorioDeTeste => {
  let contatos: Contato[] = [];
  let proximoId = 1;

  return {
    repositorio: {
      async criar(dados) {
        const contato = { id: proximoId++, ...dados };
        contatos.push(contato);
        return contato;
      },
      listar: async () => [...contatos],
      async atualizar(id, dados) {
        const atual = contatos.find((contato) => contato.id === id);
        if (atual === undefined) {
          return null;
        }
        Object.assign(atual, dados);
        return { ...atual };
      },
      async excluir(id) {
        const quantidadeAnterior = contatos.length;
        contatos = contatos.filter((contato) => contato.id !== id);
        return contatos.length < quantidadeAnterior;
      },
    },
    async limpar() {
      contatos = [];
      proximoId = 1;
    },
    encerrar: async () => undefined,
  };
};

const criarRepositorioMySql = async (): Promise<RepositorioDeTeste> => {
  const pool = criarPoolTeste();
  await aplicarMigracoes(pool);

  return {
    repositorio: criarContatoRepository(pool),
    async limpar() {
      await pool.query('TRUNCATE TABLE contatos');
    },
    encerrar: () => pool.end(),
  };
};

export const criarRepositorioDeTeste = async (): Promise<RepositorioDeTeste> =>
  process.env.TEST_REPOSITORIO === 'mysql' ? criarRepositorioMySql() : criarRepositorioEmMemoria();
