/**
 * Centralização de Services da API
 * 
 * Este arquivo exporta todos os services para facilitar a importação nos componentes.
 * 
 * Uso recomendado:
 * import { authService, userService, rbacService } from '@/services';
 */

export { authService } from './authService';
export { userService } from './userService';
export { rbacService } from './rbacService';
export { settingsService } from './settingsService';
export { logsService } from './logsService';
export { pricingService } from './pricingService';
export { collaboratorsService } from './collaboratorsService';
export { nonConformitiesService } from './nonConformitiesService';
export { disputesService } from './disputesService';
export { commissionsService } from './commissionsService';
