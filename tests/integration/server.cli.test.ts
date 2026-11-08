import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const servidor = fileURLToPath(new URL('../../src/server.ts', import.meta.url));

const iniciarServidor = (ambiente: Record<string, string>) =>
  spawnSync(process.execPath, ['--import', 'tsx', servidor], {
    env: { ...process.env, ...ambiente },
    encoding: 'utf8',
    timeout: 10000,
  });

describe('inicialização da API', () => {
  it('informa só o código quando o banco recusa a autenticação', () => {
    const resultado = iniciarServidor({
      DB_USER: 'usuario_nao_expor',
      DB_PASSWORD: 'senha-nao-expor',
    });

    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain('ER_ACCESS_DENIED_ERROR');
    expect(resultado.stderr).not.toContain('usuario_nao_expor');
    expect(resultado.stderr).not.toContain('senha-nao-expor');
    expect(resultado.stderr).not.toContain('Access denied');
  });

  it('diz qual variável está inválida sem imprimir o valor', () => {
    const resultado = iniciarServidor({ DB_PORT: 'valor-nao-expor' });

    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain('Configuração inválida: DB_PORT');
    expect(resultado.stderr).not.toContain('valor-nao-expor');
  });
});
