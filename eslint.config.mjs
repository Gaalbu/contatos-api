import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const semComentarios = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      Program() {
        for (const comentario of context.sourceCode.getAllComments()) {
          context.report({
            loc: comentario.loc,
            message: 'Comentários são proibidos neste projeto.',
          });
        }
      },
    };
  },
};

export default tseslint.config(
  { ignores: ['dist/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    plugins: { projeto: { rules: { 'sem-comentarios': semComentarios } } },
    rules: { 'projeto/sem-comentarios': 'error' },
  },
);
