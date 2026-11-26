/** Safe OpenRouter rate-limit classifier: never expose raw body, credentials or prompts. */
export const OPENROUTER_LIMIT_SOURCES=[
 'openrouter_free_tier_per_minute',
 'openrouter_free_tier_daily',
 'upstream_provider_shared_pool',
 'openrouter_key_limit',
 'openrouter_credits',
 'openrouter_in_flight_budget'
] as const;
export type OpenRouterLimitSource=typeof OPENROUTER_LIMIT_SOURCES[number]|'unknown';
export function openRouterLimitSource(data:unknown):OpenRouterLimitSource{
 if(!data||typeof data!=='object')return 'unknown';
 const outer=data as {error?:{metadata?:{limit_source?:unknown}}};
 const value=outer.error?.metadata?.limit_source;
 return typeof value==='string'&&OPENROUTER_LIMIT_SOURCES.some(s=>s===value)?value as OpenRouterLimitSource:'unknown';
}
export function openRouterLimitClass(source:OpenRouterLimitSource):
 'account_minute'|'account_daily'|'provider_pool'|'key_or_credits'|'other'{
 if(source==='openrouter_free_tier_per_minute')return 'account_minute';
 if(source==='openrouter_free_tier_daily')return 'account_daily';
 if(source==='upstream_provider_shared_pool')return 'provider_pool';
 if(source==='openrouter_key_limit'||source==='openrouter_credits')return 'key_or_credits';
 return 'other';
}
