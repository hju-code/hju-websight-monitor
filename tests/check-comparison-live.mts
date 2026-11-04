import 'dotenv/config';
import { collectUniversityComparison } from '../src/collectors/university-comparison';
const id = process.env.NAVER_CLIENT_ID || ''; const secret = process.env.NAVER_CLIENT_SECRET || '';
if (!id || !secret || /CHANGE_ME/i.test(id + secret)) { console.log('NAVER credentials unavailable or placeholders; live check skipped.'); }
else { const result = await collectUniversityComparison({ clientId: id, clientSecret: secret }); console.log(JSON.stringify({ periodStart: result.periodStart, periodEnd: result.periodEnd, rows: result.rows }, null, 2)); }
