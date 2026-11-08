export type Contato = {
  id: number;
  nome: string;
  telefone: string;
};

export type NovoContato = Omit<Contato, 'id'>;

export type AlteracaoContato = Partial<NovoContato>;

export interface ContatoRepository {
  criar(dados: NovoContato): Promise<Contato>;
  listar(): Promise<Contato[]>;
  atualizar(id: number, dados: AlteracaoContato): Promise<Contato | null>;
  excluir(id: number): Promise<boolean>;
}
