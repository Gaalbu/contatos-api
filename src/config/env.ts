import { config } from 'dotenv';
import { z } from 'zod';

config({ quiet: true });

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

const porta = z.string().regex(/^\d+$/).pipe(z.coerce.number<string>().int().min(1).max(65535));
const texto = z.string().trim().min(1);
const esquema = z.object({
  PORT: porta,
  DB_HOST: texto,
  DB_PORT: porta,
  DB_USER: texto,
  DB_PASSWORD: z.string(),
  DB_NAME: texto,
});

export class ConfiguracaoInvalidaError extends Error {}

export const carregarConfig = (): Config => {
  const resultado = esquema.safeParse(process.env);
  if (!resultado.success) {
    const variaveis = [...new Set(resultado.error.issues.map((erro) => erro.path.join('.')))];
    throw new ConfiguracaoInvalidaError(`Configuração inválida: ${variaveis.join(', ')}`);
  }
  const ambiente = resultado.data;
  return {
    porta: ambiente.PORT,
    banco: {
      host: ambiente.DB_HOST,
      porta: ambiente.DB_PORT,
      usuario: ambiente.DB_USER,
      senha: ambiente.DB_PASSWORD,
      nome: ambiente.DB_NAME,
    },
  };
};
