import { loadEnvironment } from './load-env.mjs';
import { initializeDatabase, database } from '../server/database.mjs';

loadEnvironment();
try {
  await initializeDatabase();
  const rows = await database()`SELECT count(*)::int AS families FROM family_trees`;
  console.log(`Neon terhubung. Schema siap; ${rows[0].families} keluarga tersedia.`);
} catch (error) {
  console.error(`Setup Neon gagal (${error.code || error.name}). Periksa koneksi dan DATABASE_URL.`);
  process.exitCode = 1;
}
