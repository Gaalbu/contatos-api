import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { configBancoTeste } from './apoio/banco.js';

const migracao = fileURLToPath(new URL('../../src/db/migrate.ts', import.meta.url));

describe('comando de migração', () => {
  it('aplica e reaplica pelo comando sem erro', () => {
    const banco = configBancoTeste();
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const resultado = spawnSync(process.execPath, ['--import', 'tsx', migracao], {
        env: { ...process.env, DB_NAME: banco.nome },
        encoding: 'utf8',
        timeout: 10000,
      });
      expect(resultado.error).toBeUndefined();
      expect(resultado.stderr).toBe('');
      expect(resultado.status).toBe(0);
    }
  });

  it('informa o código da falha sem imprimir a senha', () => {
    const banco = configBancoTeste();
    const senha = 'senha-invalida-nao-expor';
    const resultado = spawnSync(process.execPath, ['--import', 'tsx', migracao], {
      env: {
        ...process.env,
        DB_NAME: banco.nome,
        DB_USER: 'usuario_inexistente',
        DB_PASSWORD: senha,
      },
      encoding: 'utf8',
      timeout: 10000,
    });
    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain('ER_ACCESS_DENIED_ERROR');
    expect(resultado.stderr).not.toContain(senha);
    expect(resultado.stderr).not.toContain('SELECT');
  });
});
