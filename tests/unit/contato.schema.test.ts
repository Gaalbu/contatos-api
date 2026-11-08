import { describe, expect, it } from 'vitest';

import {
  alteracaoContatoSchema,
  novoContatoSchema,
  parametrosContatoSchema,
} from '../../src/contatos/contato.schema.js';
import {
  dddsExistentes,
  nomesInvalidos,
  nomesValidos,
  telefonesInvalidos,
  telefonesValidos,
} from '../apoio/casos-de-validacao.js';

const TELEFONE = '91988887777';
const NOME = 'Ana Souza';
const TODOS_OS_DDDS = Array.from({ length: 99 }, (_, indice) => indice + 1);

describe('novoContatoSchema', () => {
  it.each(nomesValidos)('aceita o nome %j e o normaliza', (entrada, esperado) => {
    expect(novoContatoSchema.parse({ nome: entrada, telefone: TELEFONE }).nome).toBe(esperado);
  });

  it.each(nomesInvalidos)('rejeita o nome %j', (nome) => {
    expect(novoContatoSchema.safeParse({ nome, telefone: TELEFONE }).success).toBe(false);
  });

  it.each(telefonesValidos)('aceita o telefone %j e o normaliza', (entrada, esperado) => {
    expect(novoContatoSchema.parse({ nome: NOME, telefone: entrada }).telefone).toBe(esperado);
  });

  it.each(telefonesInvalidos)('rejeita o telefone %j', (telefone) => {
    expect(novoContatoSchema.safeParse({ nome: NOME, telefone }).success).toBe(false);
  });

  it.each(TODOS_OS_DDDS)('aceita o DDD %i somente se ele existir', (numero) => {
    const ddd = String(numero).padStart(2, '0');
    const telefones = [`${ddd}988887777`, `${ddd}33334444`];
    const aceitos = telefones.filter(
      (telefone) => novoContatoSchema.safeParse({ nome: NOME, telefone }).success,
    );

    expect(aceitos).toEqual(dddsExistentes.includes(numero) ? telefones : []);
  });

  it('exige o nome e o telefone', () => {
    expect(novoContatoSchema.safeParse({ nome: NOME }).success).toBe(false);
    expect(novoContatoSchema.safeParse({ telefone: TELEFONE }).success).toBe(false);
  });

  it('rejeita campo desconhecido', () => {
    const entrada = { nome: NOME, telefone: TELEFONE, idade: 30 };
    expect(novoContatoSchema.safeParse(entrada).success).toBe(false);
  });

  it.each([undefined, null, [], 'texto', 10])('rejeita o corpo %j', (corpo) => {
    expect(novoContatoSchema.safeParse(corpo).success).toBe(false);
  });
});

describe('alteracaoContatoSchema', () => {
  it('aceita apenas o nome', () => {
    expect(alteracaoContatoSchema.parse({ nome: NOME })).toEqual({ nome: NOME });
  });

  it('aceita apenas o telefone', () => {
    expect(alteracaoContatoSchema.parse({ telefone: TELEFONE })).toEqual({ telefone: TELEFONE });
  });

  it('rejeita objeto sem campos', () => {
    expect(alteracaoContatoSchema.safeParse({}).success).toBe(false);
  });

  it('aplica a regra do nome', () => {
    expect(alteracaoContatoSchema.safeParse({ nome: 'Ana Lu' }).success).toBe(false);
  });

  it('aplica a regra do telefone', () => {
    expect(alteracaoContatoSchema.safeParse({ telefone: '123' }).success).toBe(false);
  });

  it('rejeita campo desconhecido', () => {
    const entrada = { nome: NOME, apelido: 'Ana' };
    expect(alteracaoContatoSchema.safeParse(entrada).success).toBe(false);
  });
});

describe('parametrosContatoSchema', () => {
  it.each(['1', '4294967295'])('aceita o id %s', (id) => {
    expect(parametrosContatoSchema.parse({ id }).id).toBe(Number(id));
  });

  it.each(['abc', '0', '-1', '1.5', '1e3', '0x10', ' 1', '01', '4294967296', '99999999999'])(
    'rejeita o id %j',
    (id) => {
      expect(parametrosContatoSchema.safeParse({ id }).success).toBe(false);
    },
  );
});
