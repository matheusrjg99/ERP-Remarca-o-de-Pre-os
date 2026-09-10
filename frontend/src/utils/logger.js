/**
 * Logger centralizado para o frontend
 * 
 * Comportamento:
 * - Em desenvolvimento (import.meta.env.DEV = true): exibe todos os logs
 * - Em produção (build): silencia logs de debug/info/log
 * - Erros e avisos sempre aparecem (importantes em prod)
 * 
 * Uso:
 *   import { log, debug, warn, error } from '@/utils/logger';
 *   log('Mensagem geral');
 *   debug('Detalhe de fluxo', objeto);
 *   warn('Situação inesperada');
 *   error('Erro capturado', exception);
 */

const isDev = import.meta.env.DEV;

/**
 * Log informativo (só em dev)
 * Use para mensagens gerais de fluxo.
 */
export const log = (...args) => {
  if (isDev) console.log(...args);
};

/**
 * Log de debug detalhado (só em dev)
 * Prefixa automaticamente com 🔍 para identificar.
 */
export const debug = (...args) => {
  if (isDev) console.log('🔍', ...args);
};

/**
 * Log de aviso (só em dev)
 * Use para situações inesperadas mas não críticas.
 */
export const warn = (...args) => {
  if (isDev) console.warn(...args);
};

/**
 * Log de erro (SEMPRE exibe — mesmo em produção)
 * Erros são importantes para monitoramento em prod.
 */
export const error = (...args) => {
  console.error(...args);
};

/**
 * Agrupador de logs (só em dev)
 * Útil para debug detalhado de um bloco.
 * 
 * Uso:
 *   group('Carregando usuários', () => {
 *     log('Passo 1');
 *     log('Passo 2');
 *   });
 */
export const group = (label, fn) => {
  if (!isDev) return;
  console.group(label);
  try {
    fn();
  } finally {
    console.groupEnd();
  }
};

export default { log, debug, warn, error, group };