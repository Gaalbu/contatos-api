export const nomesValidos = [
  ['Ana Souza', 'Ana Souza'],
  ['  Ana   Souza  ', 'Ana Souza'],
  ['José Araújo', 'José Araújo'],
  ['Ana Luz Silva', 'Ana Luz Silva'],
  ['Maria-Clara Souza', 'Maria-Clara Souza'],
  ["Sant'Ana Souza", "Sant'Ana Souza"],
  ['José Araújo', 'José Araújo'],
  [`${'a'.repeat(59)} ${'b'.repeat(60)}`, `${'a'.repeat(59)} ${'b'.repeat(60)}`],
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
];

export const telefonesValidos = [
  ['91988887777', '91988887777'],
  ['(91) 98888-7777', '91988887777'],
  ['+55 91 98888-7777', '91988887777'],
  ['55988887777', '55988887777'],
  ['(91) 3333-4444', '9133334444'],
] as const;

export const telefonesInvalidos: readonly unknown[] = [
  '123',
  '00988887777',
  '91 78888-7777',
  '9188887777',
  '91a98887777',
  '91+988887777',
  91988887777,
  null,
  '',
];

export const idsInvalidos = ['abc', '0', '-1', '1.5', '1e3', '0x10', '%201', '4294967296'] as const;
