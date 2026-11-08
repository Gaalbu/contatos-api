import { z } from 'zod';

const TAMANHO_MAXIMO_NOME = 120;
const MINIMO_PALAVRAS = 2;
const MINIMO_LETRAS_POR_PALAVRA = 3;
const ID_MAXIMO = 4_294_967_295;

const FORMATO_PALAVRA = /^\p{L}+(?:['’-]\p{L}+)*$/u;
const LETRA = /\p{L}/gu;
const SEPARADORES_TELEFONE = /[\s().-]/g;
const TELEFONE_COM_DDI = /^55\d{10,11}$/;
const FORMATO_TELEFONE = /^[1-9]{2}(?:9\d{8}|[2-5]\d{7})$/;
const FORMATO_ID = /^[1-9]\d{0,9}$/;

const normalizarNome = (nome: string) => nome.normalize('NFC').trim().replace(/\s+/g, ' ');

const separarPalavras = (nome: string) => nome.split(' ');

const contarLetras = (palavra: string) => palavra.match(LETRA)?.length ?? 0;

const normalizarTelefone = (telefone: string) => {
  const semSeparadores = telefone.replace(SEPARADORES_TELEFONE, '');
  const semMais = semSeparadores.startsWith('+') ? semSeparadores.slice(1) : semSeparadores;
  return TELEFONE_COM_DDI.test(semMais) ? semMais.slice(2) : semMais;
};

const mensagemDeTexto = (campo: string) => (entrada: { input: unknown }) =>
  entrada.input === undefined ? `Informe o ${campo}` : `O ${campo} deve ser um texto`;

const nomeSchema = z
  .string({ error: mensagemDeTexto('nome') })
  .transform(normalizarNome)
  .refine((nome) => nome.length <= TAMANHO_MAXIMO_NOME, {
    error: `O nome deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres`,
    abort: true,
  })
  .refine((nome) => separarPalavras(nome).length >= MINIMO_PALAVRAS, {
    error: `Informe ao menos ${MINIMO_PALAVRAS} palavras`,
    abort: true,
  })
  .refine((nome) => separarPalavras(nome).every((palavra) => FORMATO_PALAVRA.test(palavra)), {
    error: 'O nome deve conter apenas letras, hífens e apóstrofos entre letras',
    abort: true,
  })
  .refine(
    (nome) =>
      separarPalavras(nome).every((palavra) => contarLetras(palavra) >= MINIMO_LETRAS_POR_PALAVRA),
    { error: `Cada palavra deve ter ao menos ${MINIMO_LETRAS_POR_PALAVRA} letras` },
  );

const telefoneSchema = z
  .string({ error: mensagemDeTexto('telefone') })
  .transform(normalizarTelefone)
  .refine((telefone) => FORMATO_TELEFONE.test(telefone), {
    error: 'Informe um telefone brasileiro válido, com DDD',
  });

const camposDoContato = { nome: nomeSchema, telefone: telefoneSchema };

const MENSAGEM_CORPO_INVALIDO = 'O corpo deve ser um objeto JSON';

export const novoContatoSchema = z.strictObject(camposDoContato, {
  error: MENSAGEM_CORPO_INVALIDO,
});

export const alteracaoContatoSchema = z
  .strictObject(camposDoContato, { error: MENSAGEM_CORPO_INVALIDO })
  .partial()
  .refine((campos) => Object.keys(campos).length > 0, {
    error: 'Informe ao menos um campo para atualizar',
  });

export const parametrosContatoSchema = z.object({
  id: z
    .string()
    .regex(FORMATO_ID, { error: 'O id deve ser um inteiro positivo' })
    .transform(Number)
    .refine((id) => id <= ID_MAXIMO, { error: `O id deve ser no máximo ${ID_MAXIMO}` }),
});
