import type { AlteracaoContato, Contato, ContatoRepository, NovoContato } from './contato.types.js';

export class ContatoNaoEncontradoError extends Error {
  constructor() {
    super('Contato não encontrado');
    this.name = 'ContatoNaoEncontradoError';
  }
}

export type ContatoService = {
  criar(dados: NovoContato): Promise<Contato>;
  listar(): Promise<Contato[]>;
  atualizar(id: number, dados: AlteracaoContato): Promise<Contato>;
  excluir(id: number): Promise<void>;
};

export const criarContatoService = (contatos: ContatoRepository): ContatoService => ({
  criar: (dados) => contatos.criar(dados),

  listar: () => contatos.listar(),

  async atualizar(id, dados) {
    const contato = await contatos.atualizar(id, dados);
    if (contato === null) {
      throw new ContatoNaoEncontradoError();
    }
    return contato;
  },

  async excluir(id) {
    const excluido = await contatos.excluir(id);
    if (!excluido) {
      throw new ContatoNaoEncontradoError();
    }
  },
});
