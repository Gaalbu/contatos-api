export const nomeNoLimiteForaDoPlanoBasico = `${'𠮷'.repeat(59)} ${'𠮷'.repeat(60)}`;

export const nomesValidos = [
  ['Ana Souza', 'Ana Souza'],
  ['  Ana   Souza  ', 'Ana Souza'],
  ['José Araújo', 'José Araújo'],
  ['Ana Luz Silva', 'Ana Luz Silva'],
  ['Maria-Clara Souza', 'Maria-Clara Souza'],
  ["Sant'Ana Souza", "Sant'Ana Souza"],
  ['José Araújo'.normalize('NFD'), 'José Araújo'],
  [`${'a'.repeat(59)} ${'b'.repeat(60)}`, `${'a'.repeat(59)} ${'b'.repeat(60)}`],
  [nomeNoLimiteForaDoPlanoBasico, nomeNoLimiteForaDoPlanoBasico],
] as const;

export const nomesInvalidos: readonly unknown[] = [
  'Ana',
  'Ana Lu',
  'João da Silva',
  'A-B Silva',
  'Jo4o Silva',
  'Ana Souza!',
  '-Ana Souza',
  '',
  '   ',
  null,
  123,
  [],
  `${'a'.repeat(60)} ${'b'.repeat(60)}`,
  `${'𠮷'.repeat(60)} ${'𠮷'.repeat(60)}`,
];

export const dddsExistentes: readonly number[] = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43,
  44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77,
  79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
];

export const telefonesValidos = [
  ['91988887777', '91988887777'],
  ['(91) 98888-7777', '91988887777'],
  ['+55 91 98888-7777', '91988887777'],
  ['(+55) 91 98888-7777', '91988887777'],
  ['5591988887777', '91988887777'],
  ['+55 91 3333-4444', '9133334444'],
  ['55988887777', '55988887777'],
  ['(91) 3333-4444', '9133334444'],
] as const;

export const telefonesInvalidos: readonly unknown[] = [
  '123',
  '+91 98888-7777',
  '+91 91 98888-7777',
  '+55988887777',
  '+1 415 555-2671',
  '00988887777',
  '23988887777',
  '(25) 3333-4444',
  '+55 23 98888-7777',
  '91 78888-7777',
  '9188887777',
  '91a98887777',
  '91+988887777',
  91988887777,
  null,
  '',
];

export const idsInvalidos = ['abc', '0', '-1', '1.5', '1e3', '0x10', '%201', '4294967296'] as const;
