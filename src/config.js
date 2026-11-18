import { existsSync } from 'node:fs';
import { wordpress } from './adapters/wordpress.js';

if (existsSync('.env')) process.loadEnvFile('.env');

// Credentials come from the environment only: STAGING_WP_URL, PRODUCTION_WP_URL and so on.
export function connect(site) {
  const prefix = `${site.toUpperCase()}_WP_`;
  const read = (name) => {
    const value = process.env[prefix + name];
    if (!value) throw new Error(`${prefix}${name} is not set. See .env.example.`);
    return value;
  };
  return wordpress({
    baseUrl: read('URL').replace(/\/$/, ''),
    user: read('USER'),
    appPassword: read('APP_PASSWORD'),
  });
}
