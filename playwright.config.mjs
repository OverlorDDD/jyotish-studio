import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',timeout:45_000,
 expect:{timeout:10_000},workers:process.env.CI?1:undefined,retries:process.env.CI?1:0,
 use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000',
  trace:'retain-on-failure',screenshot:'only-on-failure',headless:true},
 reporter:process.env.CI?'line':'list',
 projects:[
  {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
  {name:'mobile-chromium',use:{...devices['iPhone 13'],browserName:'chromium'}}
 ]
});
