import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { criarApp } from '../../src/app.js';
import { idsInvalidos, nomesInvalidos, telefonesInvalidos } from '../apoio/casos-de-validacao.js';
import { criarRepositorioDeTeste, type RepositorioDeTeste } from './apoio/repositorio-de-teste.js';

const NOME = 'Ana Souza';
const TELEFONE = '91988887777';
const CONTATO = { nome: NOME, telefone: TELEFONE };

describe('API de contatos', () => {
  let banco: RepositorioDeTeste;
  let app: Express;

  const criarContato = async () => {
    const resposta = await request(app).post('/contatos').send(CONTATO).expect(201);
    return resposta.body as { id: number };
  };

  beforeAll(() => {
    banco = criarRepositorioDeTeste();
    app = criarApp(banco.repositorio);
  });

  beforeEach(async () => {
    await banco.limpar();
  });

  afterAll(async () => {
    await banco.encerrar();
  });

  describe('POST /contatos', () => {
    it('cria o contato, devolve 201 e informa a localização', async () => {
      const resposta = await request(app).post('/contatos').send(CONTATO);

      expect(resposta.status).toBe(201);
      expect(resposta.body).toEqual({ id: 1, ...CONTATO });
      expect(resposta.headers.location).toBe('/contatos/1');
    });

    it('persiste nome e telefone normalizados', async () => {
      const resposta = await request(app)
        .post('/contatos')
        .send({ nome: '  José   Araújo ', telefone: '+55 (91) 98888-7777' });

      expect(resposta.body).toEqual({ id: 1, nome: 'José Araújo', telefone: TELEFONE });
    });

    it('aceita repetir o mesmo telefone', async () => {
      await criarContato();
      await request(app).post('/contatos').send(CONTATO).expect(201);
    });

    it.each(nomesInvalidos)('rejeita o nome %j com detalhe do campo', async (nome) => {
      const resposta = await request(app).post('/contatos').send({ nome, telefone: TELEFONE });

      expect(resposta.status).toBe(400);
      expect(resposta.body.mensagem).toBe('Dados inválidos');
      expect(resposta.body.erros[0].campo).toBe('nome');
    });

    it.each(telefonesInvalidos)('rejeita o telefone %j com detalhe do campo', async (telefone) => {
      const resposta = await request(app).post('/contatos').send({ nome: NOME, telefone });

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros[0].campo).toBe('telefone');
    });

    it('aponta os dois campos ausentes', async () => {
      const resposta = await request(app).post('/contatos').send({});

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros.map((erro: { campo: string }) => erro.campo)).toEqual([
        'nome',
        'telefone',
      ]);
    });

    it('rejeita campo desconhecido e o identifica', async () => {
      const resposta = await request(app)
        .post('/contatos')
        .send({ ...CONTATO, admin: true });

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros).toEqual([{ campo: 'admin', mensagem: 'Campo não permitido' }]);
    });
  });

  describe('corpo da requisição', () => {
    it.each(['[]', '[1, 2]'])('rejeita o corpo %s, que não é objeto', async (corpo) => {
      const resposta = await request(app)
        .post('/contatos')
        .set('Content-Type', 'application/json')
        .send(corpo);

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros[0].campo).toBe('corpo');
    });

    it.each(['"texto"', '10', '{"nome":'])('rejeita o JSON %s', async (corpo) => {
      const resposta = await request(app)
        .post('/contatos')
        .set('Content-Type', 'application/json')
        .send(corpo);

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ mensagem: 'JSON malformado' });
    });

    it('rejeita requisição sem corpo', async () => {
      const resposta = await request(app).post('/contatos');

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros[0].campo).toBe('corpo');
    });

    it('rejeita corpo que não seja application/json', async () => {
      const resposta = await request(app)
        .post('/contatos')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(CONTATO));

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros[0].campo).toBe('corpo');
    });

    it('rejeita corpo acima de 100 KB', async () => {
      const resposta = await request(app)
        .post('/contatos')
        .send({ nome: 'a'.repeat(102_401), telefone: TELEFONE });

      expect(resposta.status).toBe(413);
      expect(resposta.body.mensagem).toBeTypeOf('string');
    });
  });

  describe('GET /contatos', () => {
    it('devolve lista vazia quando não há contatos', async () => {
      const resposta = await request(app).get('/contatos');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });

    it('lista em ordem crescente de id', async () => {
      await criarContato();
      await criarContato();
      await criarContato();

      const resposta = await request(app).get('/contatos').expect(200);

      expect(resposta.body.map((contato: { id: number }) => contato.id)).toEqual([1, 2, 3]);
    });
  });

  describe('PATCH /contatos/:id', () => {
    it('atualiza só o telefone e preserva o nome', async () => {
      const { id } = await criarContato();

      const resposta = await request(app)
        .patch(`/contatos/${id}`)
        .send({ telefone: '(91) 3333-4444' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ id, nome: NOME, telefone: '9133334444' });
    });

    it('atualiza só o nome e preserva o telefone', async () => {
      const { id } = await criarContato();

      const resposta = await request(app).patch(`/contatos/${id}`).send({ nome: 'Rui Barbosa' });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ id, nome: 'Rui Barbosa', telefone: TELEFONE });
    });

    it('atualiza os dois campos', async () => {
      const { id } = await criarContato();
      const alteracao = { nome: 'Rui Barbosa', telefone: '9133334444' };

      const resposta = await request(app).patch(`/contatos/${id}`).send(alteracao);

      expect(resposta.body).toEqual({ id, ...alteracao });
    });

    it('devolve 200 quando os valores são iguais aos atuais', async () => {
      const { id } = await criarContato();

      const resposta = await request(app).patch(`/contatos/${id}`).send(CONTATO);

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ id, ...CONTATO });
    });

    it('torna a alteração visível na listagem', async () => {
      const { id } = await criarContato();
      await request(app).patch(`/contatos/${id}`).send({ nome: 'Rui Barbosa' }).expect(200);

      const resposta = await request(app).get('/contatos');

      expect(resposta.body).toEqual([{ id, nome: 'Rui Barbosa', telefone: TELEFONE }]);
    });

    it('devolve 404 para id inexistente', async () => {
      const resposta = await request(app).patch('/contatos/999').send({ nome: NOME });

      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ mensagem: 'Contato não encontrado' });
    });

    it('rejeita corpo vazio', async () => {
      const { id } = await criarContato();

      await request(app).patch(`/contatos/${id}`).send({}).expect(400);
    });

    it('rejeita requisição sem corpo', async () => {
      const { id } = await criarContato();

      await request(app).patch(`/contatos/${id}`).expect(400);
    });

    it('rejeita campo desconhecido mesmo com campo válido', async () => {
      const { id } = await criarContato();

      await request(app).patch(`/contatos/${id}`).send({ nome: NOME, apelido: 'Ana' }).expect(400);
    });

    it.each(nomesInvalidos)('rejeita o nome %j', async (nome) => {
      const { id } = await criarContato();

      await request(app).patch(`/contatos/${id}`).send({ nome }).expect(400);
    });

    it.each(telefonesInvalidos)('rejeita o telefone %j', async (telefone) => {
      const { id } = await criarContato();

      await request(app).patch(`/contatos/${id}`).send({ telefone }).expect(400);
    });

    it.each(idsInvalidos)('rejeita o id %s', async (id) => {
      const resposta = await request(app).patch(`/contatos/${id}`).send({ nome: NOME });

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros[0].campo).toBe('id');
    });
  });

  describe('DELETE /contatos/:id', () => {
    it('exclui o contato e devolve 204 sem corpo', async () => {
      const { id } = await criarContato();

      const resposta = await request(app).delete(`/contatos/${id}`);

      expect(resposta.status).toBe(204);
      expect(resposta.text).toBe('');
    });

    it('remove o contato da listagem', async () => {
      const { id } = await criarContato();
      await request(app).delete(`/contatos/${id}`).expect(204);

      const resposta = await request(app).get('/contatos');

      expect(resposta.body).toEqual([]);
    });

    it('devolve 404 ao excluir duas vezes', async () => {
      const { id } = await criarContato();
      await request(app).delete(`/contatos/${id}`).expect(204);

      await request(app).delete(`/contatos/${id}`).expect(404);
    });

    it.each(idsInvalidos)('rejeita o id %s', async (id) => {
      const resposta = await request(app).delete(`/contatos/${id}`);

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros[0].campo).toBe('id');
    });
  });

  describe('rotas desconhecidas', () => {
    it.each(['/nao-existe', '/contatos/1/telefones'])(
      'devolve 404 em JSON para %s',
      async (rota) => {
        const resposta = await request(app).get(rota);

        expect(resposta.status).toBe(404);
        expect(resposta.type).toBe('application/json');
        expect(resposta.body).toEqual({ mensagem: 'Rota não encontrada' });
      },
    );

    it('devolve 400 para caminho com codificação inválida', async () => {
      const resposta = await request(app).delete('/contatos/%E0%A4%A');

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ mensagem: 'Requisição inválida' });
    });

    it('não expõe o framework nos cabeçalhos', async () => {
      const resposta = await request(app).get('/contatos');

      expect(resposta.headers['x-powered-by']).toBeUndefined();
    });
  });
});
