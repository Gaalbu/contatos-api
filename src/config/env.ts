export type ConfigBanco = {
  host: string;
  porta: number;
  usuario: string;
  senha: string;
  nome: string;
};

export type Config = {
  porta: number;
  banco: ConfigBanco;
};

export const carregarConfig: () => Config = () => {
  throw new Error('Não implementado');
};
