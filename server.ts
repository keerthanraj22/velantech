import express, { Request, Response } from 'express';
import path from 'path';
import * as fs from 'node:fs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import mysql, { Pool } from 'mysql2/promise';
import {
  INITIAL_CATEGORIES,
  INITIAL_KNOWLEDGE_ARTICLES,
  MOCK_WEATHER
} from './src/data/mockData';
import { Equipment, User, Booking, KnowledgeArticle, SupportComplaint, FilterState } from './src/types';

// Local persistent inventory store. Equipment survives development-server restarts.
const EQUIPMENT_STORE_PATH = path.resolve(process.cwd(), 'data', 'equipment.json');
const ACCOUNT_STORE_PATH = path.resolve(process.cwd(), 'data', 'accounts.json');
const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'agriequip_connect';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_CONNECTION_LIMIT = Math.max(1, Number(process.env.MYSQL_CONNECTION_LIMIT || 20));
const AI_MAX_CONCURRENT_REQUESTS = Math.max(1, Number(process.env.AI_MAX_CONCURRENT_REQUESTS || 8));
const AI_MAX_QUEUE_SIZE = Math.max(0, Number(process.env.AI_MAX_QUEUE_SIZE || 40));
const AI_RATE_LIMIT_PER_MINUTE = Math.max(1, Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 20));
const GEMINI_RESEARCH_MODEL = process.env.GEMINI_RESEARCH_MODEL || 'gemini-3.5-flash-lite';

let mysqlPool: Pool | null = null;
let mysqlReady = false;
let persistenceQueue: Promise<void> = Promise.resolve();

class AiRequestQueue {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= AI_MAX_CONCURRENT_REQUESTS) {
      if (this.waiting.length >= AI_MAX_QUEUE_SIZE) throw new Error('AI_QUEUE_FULL');
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    this.active += 1;
    try {
      return await task();
    } finally {
      this.active -= 1;
      this.waiting.shift()?.();
    }
  }
}

const aiRequestQueue = new AiRequestQueue();
type AdvisorSource = { title: string; url: string };
type AdvisorReply = { response: string; sources: AdvisorSource[] };
const aiResponseCache = new Map<string, AdvisorReply & { expiresAt: number }>();
const aiRateLimits = new Map<string, { count: number; resetAt: number }>();

function loadEquipment(): Equipment[] {
  try {
    if (!fs.existsSync(EQUIPMENT_STORE_PATH)) return [];
    const saved = JSON.parse(fs.readFileSync(EQUIPMENT_STORE_PATH, 'utf8'));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error('Unable to load equipment store:', error);
    return [];
  }
}

function saveEquipment(equipment: Equipment[]) {
  try {
    fs.mkdirSync(path.dirname(EQUIPMENT_STORE_PATH), { recursive: true });
    fs.writeFileSync(EQUIPMENT_STORE_PATH, JSON.stringify(equipment, null, 2), 'utf8');
  } catch (error) {
    console.error('Unable to save equipment store:', error);
  }
  queueMySqlPersistence(persistEquipment);
}

function loadAccounts(): { users: User[]; credentials: [string, string][] } {
  try {
    if (!fs.existsSync(ACCOUNT_STORE_PATH)) return { users: [], credentials: [] };
    const saved = JSON.parse(fs.readFileSync(ACCOUNT_STORE_PATH, 'utf8'));
    return { users: Array.isArray(saved.users) ? saved.users : [], credentials: Array.isArray(saved.credentials) ? saved.credentials : [] };
  } catch (error) {
    console.error('Unable to load account store:', error);
    return { users: [], credentials: [] };
  }
}

const savedAccounts = loadAccounts();
let users: User[] = savedAccounts.users;
const credentials = new Map<string, string>(savedAccounts.credentials);

function saveAccounts() {
  try {
    fs.mkdirSync(path.dirname(ACCOUNT_STORE_PATH), { recursive: true });
    fs.writeFileSync(ACCOUNT_STORE_PATH, JSON.stringify({ users, credentials: [...credentials.entries()] }, null, 2), 'utf8');
  } catch (error) {
    console.error('Unable to save account store:', error);
  }
  queueMySqlPersistence(persistAccounts);
}

function logMySqlPersistenceError(error: unknown) {
  console.error(`MySQL persistence failed: ${error instanceof Error ? error.message : error}`);
}

function queueMySqlPersistence(task: () => Promise<void>) {
  const queuedTask = persistenceQueue.then(task, task);
  persistenceQueue = queuedTask.catch(logMySqlPersistenceError);
}

function ensureDefaultAdmin() {
  const email = 'keerthanraj@uit.ac.in';
  let admin = users.find((user) => user.email.toLowerCase() === email);

  if (!admin) {
    admin = {
      id: 'usr-default-admin',
      name: 'keerthan',
      email,
      phone: 'Not set',
      role: 'admin',
      isVerified: true,
      status: 'active',
      language: 'English',
      createdAt: new Date().toISOString().split('T')[0],
      address: {
        village: 'Coimbatore',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641001',
        latitude: 11.0168,
        longitude: 76.9558
      }
    };
    users.push(admin);
  } else {
    admin.name = 'keerthan';
    admin.role = 'admin';
    admin.isVerified = true;
    admin.status = 'active';
  }

  credentials.set(admin.id, 'uit@#229');
  saveAccounts();
}

ensureDefaultAdmin();

let equipmentList: Equipment[] = loadEquipment();
let categories = [...INITIAL_CATEGORIES];
let bookings: Booking[] = [];
type PaymentRecord = { id: string; bookingId: string; farmerId: string; providerId: string; equipmentId: string; amount: number; currency: 'INR'; gateway: string; gatewayOrderId: string; gatewayPaymentId?: string; status: 'Pending' | 'Paid' | 'Failed' | 'Refunded'; createdAt: string; paidAt?: string };
type PayoutRecord = { id: string; bookingId: string; providerId: string; amount: number; currency: 'INR'; status: 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Cancelled'; requestedAt: string; processedAt?: string; processedBy?: string; gatewayPayoutId?: string; failureReason?: string; manual?: boolean };
let payments: PaymentRecord[] = [];
let payouts: PayoutRecord[] = [];
let paymentSettings = { commissionPercent: Number(process.env.PLATFORM_COMMISSION_PERCENT || 10), payoutRelease: process.env.PAYOUT_RELEASE || 'rental_completed' };
let knowledgeArticles: KnowledgeArticle[] = [...INITIAL_KNOWLEDGE_ARTICLES];
let supportComplaints: SupportComplaint[] = [];
const PLATFORM_COMMISSION_RATE = 0.1;

type KnowledgeUpdate = { id: string; title: string; summary: string; source: string; sourceUrl: string; canonicalUrl: string; publishedAt?: string; fetchedAt: string; language: 'en' | 'ta'; category: string; state: 'india' | 'tamil-nadu'; guid?: string };
type FarmerScheme = { id: string; name: string; description: string; government: string; state: 'india' | 'tamil-nadu'; category: string; eligibility: string; benefits: string; officialUrl: string; lastVerified: string; status: 'verify-on-portal' };
type AdvisorMessage = { sender: 'user' | 'ai'; text: string };
let knowledgeFeedCache: { fetchedAt: number; news: KnowledgeUpdate[] } | null = null;
const KNOWLEDGE_CACHE_MS = 20 * 60 * 1000;
const officialSchemes: FarmerScheme[] = [
  { id: 'pm-kisan', name: 'PM-KISAN', description: 'Income support information and beneficiary services.', government: 'Government of India', state: 'india', category: 'Financial Support', eligibility: 'Check the official portal for current landholder eligibility and exclusions.', benefits: 'Verify the current benefit and payment status on the official portal.', officialUrl: 'https://pmkisan.gov.in/', lastVerified: '2026-09-10', status: 'verify-on-portal' },
  { id: 'pmfby', name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', description: 'Crop-insurance programme information, enrolment and claim guidance.', government: 'Government of India', state: 'india', category: 'Crop Insurance', eligibility: 'Availability, crop coverage and deadlines vary by notified area and season.', benefits: 'Insurance support subject to the applicable seasonal notification.', officialUrl: 'https://pmfby.gov.in/', lastVerified: '2026-09-10', status: 'verify-on-portal' },
  { id: 'pm-kusum', name: 'PM-KUSUM', description: 'Solar agriculture and pump programme information.', government: 'Government of India', state: 'india', category: 'Solar Agriculture', eligibility: 'Check your state implementation agency and current component availability.', benefits: 'Support varies by component and state implementation.', officialUrl: 'https://pmkusum.mnre.gov.in/', lastVerified: '2026-09-10', status: 'verify-on-portal' },
  { id: 'smam', name: 'Sub-Mission on Agricultural Mechanization (SMAM)', description: 'Mechanization, Custom Hiring Centre and machinery-support information.', government: 'Government of India', state: 'india', category: 'Farm Machinery Subsidy', eligibility: 'Check the official portal and your state agriculture department for current notices.', benefits: 'Support and application windows vary by state and notification.', officialUrl: 'https://agrimachinery.nic.in/CitizenCorner/CitizenCorner', lastVerified: '2026-09-10', status: 'verify-on-portal' },
  { id: 'tn-agrisnet', name: 'Tamil Nadu Agriculture & Farmers Welfare Services', description: 'Tamil Nadu farmer services, notifications and current state agriculture programmes.', government: 'Tamil Nadu Government', state: 'tamil-nadu', category: 'Crop Support', eligibility: 'Use the official Tamil Nadu portal to confirm district-specific availability.', benefits: 'Benefits and applications are published by the department.', officialUrl: 'https://www.tnagrisnet.tn.gov.in/home/index/', lastVerified: '2026-09-10', status: 'verify-on-portal' },
  { id: 'tn-hortnet', name: 'Tamil Nadu Horticulture Farmer Services', description: 'Horticulture notifications, micro-irrigation and farmer service links.', government: 'Tamil Nadu Government', state: 'tamil-nadu', category: 'Irrigation', eligibility: 'Confirm crop, district and programme conditions with the department.', benefits: 'Support is subject to the relevant official notification.', officialUrl: 'https://tnhorticulture.tn.gov.in/home-page', lastVerified: '2026-09-10', status: 'verify-on-portal' }
];

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function normaliseNewsTitle(value: string) { return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim(); }
function titleTokens(value: string) { return new Set(normaliseNewsTitle(value).split(' ').filter((word) => word.length > 2)); }
function titlesAreSimilar(a: string, b: string) { const one = titleTokens(a); const two = titleTokens(b); const shared = [...one].filter((token) => two.has(token)).length; return shared >= 5 && shared / Math.max(one.size, two.size, 1) >= .72; }
function classifyNews(title: string, state: 'india' | 'tamil-nadu') {
  const text = title.toLowerCase();
  if (/scheme|subsid|pm-kisan|pmfby|kusum|grant/.test(text)) return 'Government Schemes';
  if (/msp|procurement|market|price|mandi/.test(text)) return 'MSP & Market Prices';
  if (/weather|rain|monsoon|climate/.test(text)) return 'Weather & Climate';
  if (/tractor|machinery|mechanization|implement/.test(text)) return 'Farm Machinery';
  if (/icar|research|university/.test(text)) return 'ICAR & Research';
  if (/ai|digital|technology|agritech/.test(text)) return 'AgriTech';
  return state === 'tamil-nadu' ? 'Tamil Nadu Agriculture' : 'India Agriculture';
}
async function fetchRssFeed(feedUrl: string, state: 'india' | 'tamil-nadu'): Promise<KnowledgeUpdate[]> {
  const response = await fetch(feedUrl, { signal: AbortSignal.timeout(12_000), headers: { 'User-Agent': 'VELANTECH Knowledge Center/1.0' } });
  if (!response.ok) throw new Error(`Feed returned ${response.status}`);
  const xml = await response.text(); const fetchedAt = new Date().toISOString();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap((match, index) => {
    const item = match[1]; const read = (tag: string) => item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1];
    const title = decodeXml(read('title') || ''); const sourceUrl = decodeXml(read('link') || ''); const guid = decodeXml(read('guid') || sourceUrl);
    if (!title || !sourceUrl) return [];
    const source = decodeXml(read('source')?.replace(/^.*?>/, '') || (state === 'tamil-nadu' ? 'Tamil Nadu agriculture news' : 'India agriculture news'));
    const language: 'en' | 'ta' = /[\u0B80-\u0BFF]/.test(title) ? 'ta' : 'en';
    return [{ id: `${state}-${normaliseNewsTitle(title).slice(0, 70)}-${index}`, title, summary: decodeXml(read('description') || '').replace(/<[^>]+>/g, '').slice(0, 280), source, sourceUrl, canonicalUrl: sourceUrl, publishedAt: decodeXml(read('pubDate') || ''), fetchedAt, language, category: classifyNews(title, state), state, guid }];
  });
}
async function fetchTamilNaduOfficialUpdates(): Promise<KnowledgeUpdate[]> {
  const pageUrl = 'https://www.tnagrisnet.tn.gov.in/home/index/';
  const response = await fetch(pageUrl, { signal: AbortSignal.timeout(12_000), headers: { 'User-Agent': 'VELANTECH Knowledge Center/1.0' } });
  if (!response.ok) throw new Error(`Tamil Nadu portal returned ${response.status}`);
  const html = await response.text(); const fetchedAt = new Date().toISOString(); const updates: KnowledgeUpdate[] = [];
  for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const title = decodeXml(match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    if (!title || title.length < 12 || !(/[\u0B80-\u0BFF]/.test(title) || /agricultur|farmer|scheme|kuruvai/i.test(title))) continue;
    const sourceUrl = new URL(match[1], pageUrl).href;
    updates.push({ id: `tn-official-${normaliseNewsTitle(title).slice(0, 70)}`, title, summary: 'Official update published by the Tamil Nadu Agriculture & Farmers Welfare Department.', source: 'Tamil Nadu Agriculture & Farmers Welfare Department', sourceUrl, canonicalUrl: sourceUrl, fetchedAt, language: /[\u0B80-\u0BFF]/.test(title) ? 'ta' : 'en', category: classifyNews(title, 'tamil-nadu'), state: 'tamil-nadu', guid: sourceUrl });
    if (updates.length >= 12) break;
  }
  return updates;
}
async function getAgricultureNews() {
  if (knowledgeFeedCache && Date.now() - knowledgeFeedCache.fetchedAt < KNOWLEDGE_CACHE_MS) return { news: knowledgeFeedCache.news, fetchedAt: new Date(knowledgeFeedCache.fetchedAt).toISOString(), fresh: true, cached: false };
  const feeds = [
    ['https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1', 'india'] as const,
    ['https://news.google.com/rss/search?q=India+agriculture+OR+farm+machinery+OR+MSP+when%3A7d&hl=en-IN&gl=IN&ceid=IN%3Aen', 'india'] as const,
    ['https://news.google.com/rss/search?q=Tamil+Nadu+agriculture+OR+%E0%AE%B5%E0%AF%87%E0%AE%B3%E0%AE%BE%E0%AE%A3%E0%AF%8D%E0%AE%AE%E0%AF%88+when%3A7d&hl=ta&gl=IN&ceid=IN%3Ata', 'tamil-nadu'] as const
  ];
  try {
    const settled = await Promise.allSettled([...feeds.map(([url, state]) => fetchRssFeed(url, state)), fetchTamilNaduOfficialUpdates()]);
    const candidates = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const news = candidates.filter((item, index, all) => all.findIndex((other) => other.canonicalUrl === item.canonicalUrl || other.guid === item.guid || normaliseNewsTitle(other.title) === normaliseNewsTitle(item.title) || titlesAreSimilar(other.title, item.title)) === index);
    if (!news.length) throw new Error('No verified RSS items returned');
    knowledgeFeedCache = { fetchedAt: Date.now(), news };
    return { news, fetchedAt: new Date().toISOString(), fresh: true, cached: false };
  } catch (error) {
    console.warn('Unable to refresh agriculture news:', error);
    return { news: knowledgeFeedCache?.news || [], fetchedAt: knowledgeFeedCache ? new Date(knowledgeFeedCache.fetchedAt).toISOString() : null, fresh: false, cached: Boolean(knowledgeFeedCache) };
  }
}

function localAdvisorResponse(query: string, landSize?: number, crop?: string, location?: string) {
  const question = query.toLowerCase();
  const acres = Number(landSize) || 5;
  const cropName = crop || 'your crop';
  const area = location || 'your area';
  const hp = acres <= 2 ? '25–35 HP' : acres <= 5 ? '35–45 HP' : acres <= 12 ? '45–50 HP' : '50–60 HP';

  if (/weather|rain|monsoon|forecast|temperature/.test(question)) {
    return `[Smart field update for ${area}]: The dashboard forecast is ${MOCK_WEATHER.condition.toLowerCase()} at ${MOCK_WEATHER.tempC}°C, with ${MOCK_WEATHER.rainProbability}% rain probability. For ${cropName}, avoid spraying before rain; use the next dry 4–6 hour window for tillage or spraying, and check your local IMD warning before leaving for the field.`;
  }
  if (/pest|insect|disease|spray|drone|weed/.test(question)) {
    return `[Spraying plan for ${cropName}]: For ${acres} acres near ${area}, first identify the pest and follow the label dose for the approved product. A 10–16 L drone service is efficient for larger plots; for smaller or uneven plots, use a calibrated knapsack or boom sprayer. Spray early morning or late afternoon, avoid windy conditions, and wear PPE. Do not mix chemicals unless the product labels allow it.`;
  }
  if (/water|irrigation|pump|solar|kusum/.test(question)) {
    return `[Irrigation guidance]: Match pump size to your water source, lift height, pipe length and field area—not only acreage. For ${cropName} in ${area}, inspect filters, foot valve and leakage before irrigation. You can check PM-KUSUM eligibility and the current state process on the official portal linked in the Knowledge Center.`;
  }
  if (/harvest|harvester|combine|thresh/.test(question)) {
    return `[Harvest plan for ${cropName}]: Book a suitable harvester after checking crop moisture and field access. Keep bunds and approach paths clear, mark irrigation pipes, and confirm the per-acre rate, fuel responsibility and grain-handling arrangement with the provider before dispatch.`;
  }

  const implement = cropName.toLowerCase() === 'paddy' ? 'a 6–7 ft rotavator and puddler' : cropName.toLowerCase() === 'sugarcane' ? 'a cultivator or ridger suited to row spacing' : cropName.toLowerCase() === 'cotton' ? 'an intercultivator and precision sprayer' : 'a rotavator or cultivator matched to soil condition';
  return `[Machinery plan for ${cropName}]: For ${acres} acres near ${area}, start with a ${hp} tractor and ${implement}. Do one shallow pass only if soil is already moist; avoid working saturated soil because it causes compaction. Ask the provider for implement width, fuel estimate and transport charge before booking. Your question was considered: “${query}”.`;
}

function buildAdvisorPrompt(query: string, landSize?: number, crop?: string, location?: string, history: AdvisorMessage[] = []) {
  const recentConversation = history
    .filter((message) => (message.sender === 'user' || message.sender === 'ai') && typeof message.text === 'string')
    .slice(-8)
    .map((message) => `${message.sender === 'user' ? 'Farmer' : 'Advisor'}: ${message.text.slice(0, 1200)}`)
    .join('\n');

  return `You are VELANTECH AI Agronomist, a practical agricultural machinery and crop-support assistant for farmers in India.

Farmer context:
- Land size: ${Number(landSize) > 0 ? `${landSize} acres` : 'not provided'}
- Primary crop: ${crop || 'not provided'}
- Location: ${location || 'India'}

Previous conversation:
${recentConversation || 'No previous messages.'}

Latest farmer question: ${query}

Research the web before answering every substantive question. Prefer official agricultural departments, universities, IMD, ICAR, product manufacturers, and other primary sources. Give a direct, useful answer in the same language as the farmer whenever possible. Use short headings or bullets only when they improve clarity. Include suitable machinery, operating timing, and a cost-saving point when relevant. Ask one concise follow-up question when essential details are missing.

Safety rules: Do not invent weather forecasts, subsidy eligibility, product availability, prices, or pesticide doses. For pesticides, disease diagnosis, livestock illness, or emergencies, explain the limitation and advise the farmer to follow the product label and consult a local agricultural extension officer or qualified professional. Do not claim to replace an expert inspection.`;
}

function extractResearchSources(interaction: any): AdvisorSource[] {
  const sources = new Map<string, AdvisorSource>();
  for (const step of interaction.steps || []) {
    if (step.type !== 'model_output') continue;
    for (const content of step.content || []) {
      for (const annotation of content.annotations || []) {
        if (annotation.type === 'url_citation' && annotation.url) {
          sources.set(annotation.url, { title: annotation.title || annotation.url, url: annotation.url });
        }
      }
    }
  }
  return [...sources.values()];
}

async function generateGeminiAnswer(apiKey: string, prompt: string): Promise<AdvisorReply> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const interaction: any = await ai.interactions.create({
        model: GEMINI_RESEARCH_MODEL,
        input: prompt,
        tools: [{ type: 'google_search' }]
      });
      const answer = interaction.outputText?.trim();
      if (!answer) throw new Error('Gemini returned an empty response');
      return { response: answer, sources: extractResearchSources(interaction) };
    } catch (error) {
      lastError = error;
      const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 0;
      if (![429, 500, 502, 503, 504].includes(status) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function persistAccounts() {
  if (!mysqlReady || !mysqlPool) return;
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM accounts');
    if (users.length) await connection.query(
      'INSERT INTO accounts (id, data, password) VALUES ?',
      [users.map((user) => [user.id, JSON.stringify(user), credentials.get(user.id) || ''])]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function persistEquipment() {
  if (!mysqlReady || !mysqlPool) return;
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM equipment');
    if (equipmentList.length) await connection.query(
      'INSERT INTO equipment (id, data) VALUES ?',
      [equipmentList.map((equipment) => [equipment.id, JSON.stringify(equipment)])]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function persistBookings() {
  if (!mysqlReady || !mysqlPool) return;
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM bookings');
    if (bookings.length) await connection.query(
      'INSERT INTO bookings (id, data) VALUES ?',
      [bookings.map((booking) => [booking.id, JSON.stringify(booking)])]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function persistFinancialRecords() {
  if (!mysqlReady || !mysqlPool) return;
  await mysqlPool.query('DELETE FROM payments');
  await mysqlPool.query('DELETE FROM payouts');
  if (payments.length) await mysqlPool.query('INSERT INTO payments (id, booking_id, data) VALUES ?', [payments.map(p => [p.id, p.bookingId, JSON.stringify(p)])]);
  if (payouts.length) await mysqlPool.query('INSERT INTO payouts (id, booking_id, provider_id, data) VALUES ?', [payouts.map(p => [p.id, p.bookingId, p.providerId, JSON.stringify(p)])]);
  await mysqlPool.query('INSERT INTO platform_payment_settings (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)', ['default', JSON.stringify(paymentSettings)]);
}

async function initialiseMySql() {
  try {
    mysqlPool = mysql.createPool({ host: MYSQL_HOST, port: MYSQL_PORT, user: MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DATABASE, waitForConnections: true, connectionLimit: MYSQL_CONNECTION_LIMIT, queueLimit: 0, connectTimeout: 4000, enableKeepAlive: true, keepAliveInitialDelay: 0 });
    await mysqlPool.query('CREATE TABLE IF NOT EXISTS accounts (id VARCHAR(80) PRIMARY KEY, data JSON NOT NULL, password VARCHAR(255) NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    await mysqlPool.query('CREATE TABLE IF NOT EXISTS equipment (id VARCHAR(80) PRIMARY KEY, data JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    await mysqlPool.query('CREATE TABLE IF NOT EXISTS bookings (id VARCHAR(80) PRIMARY KEY, data JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    await mysqlPool.query('CREATE TABLE IF NOT EXISTS payments (id VARCHAR(80) PRIMARY KEY, booking_id VARCHAR(80) NOT NULL, data JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    await mysqlPool.query('CREATE TABLE IF NOT EXISTS payouts (id VARCHAR(80) PRIMARY KEY, booking_id VARCHAR(80) NOT NULL, provider_id VARCHAR(80) NOT NULL, data JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    await mysqlPool.query('CREATE TABLE IF NOT EXISTS platform_payment_settings (id VARCHAR(40) PRIMARY KEY, data JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    mysqlReady = true;
    const [accountRows] = await mysqlPool.query<any[]>('SELECT data, password FROM accounts');
    if (accountRows.length) {
      users = accountRows.map((account) => typeof account.data === 'string' ? JSON.parse(account.data) : account.data);
      credentials.clear();
      accountRows.forEach((account, index) => credentials.set(users[index].id, account.password));
    } else {
      await persistAccounts();
    }
    const [equipmentRows] = await mysqlPool.query<any[]>('SELECT data FROM equipment');
    if (equipmentRows.length) {
      equipmentList = equipmentRows.map((row) => typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
    } else if (equipmentList.length) {
      await persistEquipment();
    }
    const [bookingRows] = await mysqlPool.query<any[]>('SELECT data FROM bookings');
    bookings = bookingRows.map((row) => typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
    const [paymentRows] = await mysqlPool.query<any[]>('SELECT data FROM payments'); payments = paymentRows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
    const [payoutRows] = await mysqlPool.query<any[]>('SELECT data FROM payouts'); payouts = payoutRows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
    const [settingRows] = await mysqlPool.query<any[]>('SELECT data FROM platform_payment_settings WHERE id = ?', ['default']);
    if (settingRows[0]?.data) paymentSettings = typeof settingRows[0].data === 'string' ? JSON.parse(settingRows[0].data) : settingRows[0].data;
    console.log(`MySQL connected: ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`);
  } catch (error) {
    mysqlReady = false;
    mysqlPool = null;
    console.error(`MySQL connection failed. Using local JSON fallback: ${error instanceof Error ? error.message : error}`);
  }
}

function isPaidBooking(booking: Booking) {
  return booking.paymentStatus === 'Paid' && !['Rejected', 'Cancelled'].includes(booking.bookingStatus);
}

function calculatePlatformProfit(booking: Booking) {
  return Math.round((booking.rentalAmount + booking.deliveryCharge) * PLATFORM_COMMISSION_RATE);
}

// Haversine Distance Calculation formula for GeoJSON spherical distances (in Kilometers)
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ status: 'ok', database: mysqlReady ? 'mysql' : 'local-fallback', uptimeSeconds: Math.round(process.uptime()) });
  });

  app.get('/readyz', (_req: Request, res: Response) => {
    if (!mysqlReady && process.env.NODE_ENV === 'production') return res.status(503).json({ status: 'not-ready', database: 'unavailable' });
    return res.json({ status: 'ready', database: mysqlReady ? 'mysql' : 'local-fallback' });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, role, password, address, providerDetails, farmerDetails } = req.body;

    if (!name || !email || !phone || !role || !password) {
      return res.status(400).json({ error: 'Name, email, phone, role, and password are required.' });
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      phone,
      role: role || 'farmer',
      isVerified: true,
      status: role === 'provider' ? 'pending_approval' : 'active',
      language: 'English',
      createdAt: new Date().toISOString().split('T')[0],
      address: address || {
        village: 'Coimbatore',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641001',
        latitude: 11.0168,
        longitude: 76.9558
      },
      providerDetails: role === 'provider' ? {
        businessName: providerDetails?.businessName || `${name} Equipment Co`,
        bankName: providerDetails?.bankName || 'State Bank of India',
        accountNumber: providerDetails?.accountNumber || '998877665544',
        ifscCode: providerDetails?.ifscCode || 'SBIN0001122',
        walletBalance: 0,
        rating: 5.0,
        totalRentals: 0
      } : undefined,
      farmerDetails: role === 'farmer' ? {
        landSizeAcres: farmerDetails?.landSizeAcres || 5,
        primaryCrops: farmerDetails?.primaryCrops || ['Paddy', 'Sugarcane'],
        kisanCreditCardNo: farmerDetails?.kisanCreditCardNo
      } : undefined
    };

    users.push(newUser);
    credentials.set(newUser.id, password);
    saveAccounts();

    const token = `jwt-token-agri-${newUser.id}-${Date.now()}`;
    res.json({ message: 'Registration successful', token, user: newUser });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, role } = req.body;
    const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) return res.status(401).json({ error: 'No account was found for this email. Create an account to continue.' });
    if (credentials.get(user.id) !== password) return res.status(401).json({ error: 'The password is incorrect. Please try again.' });
    if (user.role !== role) return res.status(401).json({ error: 'This account is registered as a ' + user.role + '. Select the ' + user.role + ' portal and sign in again.' });

    const token = `jwt-token-agri-${user.id}-${Date.now()}`;
    res.json({ message: 'Login successful', token, user });
  });

  app.post('/api/auth/otp/send', (req: Request, res: Response) => {
    const { phone } = req.body;
    res.json({ message: `OTP request received for ${phone || 'mobile number'}. Configure an SMS provider before using OTP sign-in.` });
  });

  app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
    const { otp, phone } = req.body;
    if (otp) {
      const user = users.find((u) => u.phone === phone);
      if (!user) return res.status(404).json({ error: 'No account is registered with this phone number.' });
      const token = `jwt-token-agri-${user.id}-${Date.now()}`;
      return res.json({ message: 'OTP verified successfully', token, user });
    }
    return res.status(400).json({ error: 'Enter the verification code.' });
  });

  app.get('/api/users', (req: Request, res: Response) => {
    const { role } = req.query;
    let list = users;
    if (role) {
      list = users.filter((u) => u.role === role);
    }
    res.json(list);
  });

  app.put('/api/users/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, isVerified } = req.body;
    const user = users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (status) user.status = status;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;
    saveAccounts();
    res.json({ message: 'User status updated', user });
  });

  // ==========================================
  // EQUIPMENT CATEGORIES & LISTINGS
  // ==========================================

  app.get('/api/categories', (req: Request, res: Response) => {
    res.json(categories);
  });

  app.post('/api/categories', (req: Request, res: Response) => {
    const { name, iconName, description } = req.body;
    const newCategory = {
      id: `cat-${Date.now()}`,
      name,
      iconName: iconName || 'Tractor',
      description: description || 'Agricultural Machinery Category',
      itemCount: 0
    };
    categories.push(newCategory);
    res.status(201).json(newCategory);
  });

  app.get('/api/equipment', (req: Request, res: Response) => {
    const {
      categoryId,
      search,
      userLat = 11.0168,
      userLng = 76.9558,
      radiusKm = 50,
      fuelType,
      minHp = 0,
      availability,
      sortBy = 'distance',
      includeUnapproved
    } = req.query;

    let filtered = includeUnapproved === 'true' ? [...equipmentList] : equipmentList.filter((eq) => eq.onboardingStatus === 'approved');

    if (categoryId && categoryId !== 'all') {
      filtered = filtered.filter((eq) => eq.categoryId === categoryId);
    }

    if (fuelType && fuelType !== 'all') {
      filtered = filtered.filter((eq) => eq.fuelType.toLowerCase() === String(fuelType).toLowerCase());
    }

    if (minHp) {
      filtered = filtered.filter((eq) => eq.horsePower >= Number(minHp));
    }

    if (availability && availability !== 'all') {
      filtered = filtered.filter((eq) => eq.availabilityStatus === availability);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (eq) =>
          eq.name.toLowerCase().includes(q) ||
          eq.brand.toLowerCase().includes(q) ||
          eq.categoryName.toLowerCase().includes(q) ||
          eq.location.village.toLowerCase().includes(q) ||
          eq.location.district.toLowerCase().includes(q)
      );
    }

    // GeoSpatial Distance Calculation for each equipment item
    const uLat = Number(userLat);
    const uLng = Number(userLng);
    const rKm = Number(radiusKm);

    const resultWithDistance = filtered.map((eq) => {
      const dist = calculateHaversineDistanceKm(uLat, uLng, eq.location.coordinates[1], eq.location.coordinates[0]);
      return { ...eq, distanceKm: dist };
    });

    // Filter within Radius if specified
    const withinRadius = resultWithDistance.filter((eq) => eq.distanceKm <= rKm);

    // Sorting
    if (sortBy === 'distance') {
      withinRadius.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'price_low') {
      withinRadius.sort((a, b) => a.dailyPrice - b.dailyPrice);
    } else if (sortBy === 'price_high') {
      withinRadius.sort((a, b) => b.dailyPrice - a.dailyPrice);
    } else if (sortBy === 'rating') {
      withinRadius.sort((a, b) => b.averageRating - a.averageRating);
    }

    res.json(withinRadius);
  });

  app.get('/api/equipment/:id', (req: Request, res: Response) => {
    const eq = equipmentList.find((item) => item.id === req.params.id);
    if (!eq) return res.status(404).json({ error: 'Equipment not found' });
    res.json(eq);
  });

  // Providers submit listings for review; administrator-created inventory is published immediately.
  app.post('/api/equipment', (req: Request, res: Response) => {
    const submitterRole = req.get('x-user-role');
    if (submitterRole !== 'provider' && submitterRole !== 'admin') {
      return res.status(403).json({ error: 'Only equipment providers or administrators can submit machinery listings.' });
    }
    const data = req.body;
    const newEq: Equipment = {
      id: `eq-${Date.now()}`,
      name: data.name || 'New Agricultural Equipment',
      categoryId: data.categoryId || 'cat-1',
      categoryName: data.categoryName || 'Tractor',
      brand: data.brand || 'Mahindra',
      model: data.model || '2025 Model',
      manufacturingYear: Number(data.manufacturingYear) || 2024,
      registrationNumber: data.registrationNumber || 'TN 37 REG 001',
      description: data.description || 'High efficiency farm equipment available for rental.',
      images: data.images && data.images.length > 0 ? data.images : [],
      videos: data.videos || [],
      hourlyPrice: Number(data.hourlyPrice) || 350,
      dailyPrice: Number(data.dailyPrice) || 2500,
      weeklyPrice: Number(data.weeklyPrice) || 15000,
      monthlyPrice: Number(data.monthlyPrice) || 52000,
      depositAmount: Number(data.depositAmount) || 2500,
      fuelType: data.fuelType || 'Diesel',
      horsePower: Number(data.horsePower) || 45,
      capacity: data.capacity || 'Standard Farm Specs',
      condition: data.condition || 'Excellent',
      location: data.location || {
        type: 'Point',
        coordinates: [77.0048, 10.6609],
        village: 'Pollachi',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642001'
      },
      availabilityStatus: 'Available',
      maintenanceStatus: 'Operational',
      averageRating: 5.0,
      totalReviews: 0,
      providerId: data.providerId || 'usr-provider-1',
      providerName: data.providerName || 'Kovai Agro Equipment Rentals',
      providerPhone: data.providerPhone || '+91 94432 10987',
      deliveryAvailable: data.deliveryAvailable !== undefined ? Boolean(data.deliveryAvailable) : true,
      deliveryChargePerKm: Number(data.deliveryChargePerKm) || 25,
      createdAt: new Date().toISOString().split('T')[0]
      ,onboardingStatus: submitterRole === 'admin' ? 'approved' : 'pending_approval'
    };

    equipmentList.unshift(newEq);
    saveEquipment(equipmentList);
    res.status(201).json(newEq);
  });

  app.put('/api/equipment/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = equipmentList.findIndex((item) => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Equipment not found' });

    const changes = { ...req.body };
    // Publication status can only be changed through the administrator review route.
    delete changes.onboardingStatus;
    equipmentList[index] = { ...equipmentList[index], ...changes };
    saveEquipment(equipmentList);
    res.json(equipmentList[index]);
  });

  app.put('/api/equipment/:id/onboarding', (req: Request, res: Response) => {
    const item = equipmentList.find((eq) => eq.id === req.params.id);
    const { status } = req.body;
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    if (req.get('x-user-role') !== 'admin') {
      return res.status(403).json({ error: 'Only an administrator can approve or reject equipment listings.' });
    }
    if (!['pending_approval', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid onboarding status' });
    }
    item.onboardingStatus = status;
    saveEquipment(equipmentList);
    res.json(item);
  });

  app.delete('/api/equipment/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    equipmentList = equipmentList.filter((item) => item.id !== id);
    saveEquipment(equipmentList);
    res.json({ message: 'Equipment deleted successfully' });
  });

  // ==========================================
  // BOOKINGS & RESERVATION ENGINE
  // ==========================================

  app.get('/api/bookings', (req: Request, res: Response) => {
    const { farmerId, providerId, role } = req.query;
    let list = bookings;
    if (role === 'farmer' && farmerId) {
      list = bookings.filter((b) => b.farmerId === farmerId);
    } else if (role === 'provider' && providerId) {
      list = bookings.filter((b) => b.providerId === providerId);
    }
    res.json(list);
  });

  app.post('/api/bookings', (req: Request, res: Response) => {
    const {
      equipmentId,
      farmerId,
      startDate,
      endDate,
      startTime,
      endTime,
      rentalType,
      rentalDurationHours,
      rentalAmount,
      deliveryCharge,
      depositAmount,
      farmerAddress,
      paymentMethod,
      notes
    } = req.body;

    if (req.get('x-user-role') !== 'farmer') {
      return res.status(403).json({ error: 'Only farmer accounts can create machinery bookings.' });
    }

    const eq = equipmentList.find((item) => item.id === equipmentId);
    if (!eq) return res.status(404).json({ error: 'Equipment not found' });
    if (eq.onboardingStatus !== 'approved') {
      return res.status(403).json({ error: 'This machinery is awaiting administrator approval and cannot be booked yet.' });
    }
    if (eq.availabilityStatus !== 'Available') {
      return res.status(409).json({ error: 'This machinery is already booked or unavailable.' });
    }

    const farmer = users.find((u) => u.id === farmerId) || users[3];

    // Prices supplied by the client are never authoritative. Rebuild the rental from the listing.
    const days = Math.max(1, Math.ceil((Number(rentalDurationHours) || 10) / 10));
    const safeRentalAmount = eq.dailyPrice * days;
    const safeDeliveryCharge = Number(deliveryCharge) > 0 ? 500 : 0;
    const subTotal = safeRentalAmount + safeDeliveryCharge + Number(eq.depositAmount || 0);
    const gstAmount = Math.round(subTotal * 0.12); // 12% GST
    const totalAmount = subTotal + gstAmount;
    const commissionBase = safeRentalAmount + safeDeliveryCharge;
    const platformFee = Math.round(commissionBase * (paymentSettings.commissionPercent / 100));
    const providerAmount = commissionBase - platformFee;

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingNumber: `AGRI-BK-${Math.floor(10000 + Math.random() * 90000)}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      equipmentImage: eq.images[0],
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      providerId: eq.providerId,
      providerName: eq.providerName,
      startDate,
      endDate,
      startTime: startTime || '08:00',
      endTime: endTime || '18:00',
      rentalDurationHours: Number(rentalDurationHours) || 24,
      rentalType: rentalType || 'daily',
      rentalAmount: safeRentalAmount,
      deliveryCharge: safeDeliveryCharge,
      depositAmount: Number(eq.depositAmount) || 0,
      gstAmount,
      totalAmount,
      platformFee,
      providerAmount,
      payoutStatus: 'Pending',
      refundStatus: 'Not Requested',
      bookingStatus: 'Pending',
      paymentStatus: 'Pending',
      paymentMethod: paymentMethod || 'UPI',
      farmerAddress: farmerAddress || farmer.address,
      notes,
      createdAt: new Date().toISOString().split('T')[0]
    };

    bookings.unshift(newBooking);
    queueMySqlPersistence(persistBookings);
    res.status(201).json(newBooking);
  });

  app.put('/api/bookings/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { bookingStatus, paymentStatus } = req.body;
    const bk = bookings.find((b) => b.id === id);
    if (!bk) return res.status(404).json({ error: 'Booking not found' });

    if (bookingStatus) bk.bookingStatus = bookingStatus;
    if (paymentStatus) bk.paymentStatus = paymentStatus;

    if (bookingStatus && ['Completed', 'Cancelled', 'Rejected'].includes(bookingStatus)) {
      const hasAnotherActiveBooking = bookings.some((booking) => booking.id !== bk.id && booking.equipmentId === bk.equipmentId && !['Completed', 'Cancelled', 'Rejected'].includes(booking.bookingStatus));
      if (!hasAnotherActiveBooking) {
        const equipment = equipmentList.find((item) => item.id === bk.equipmentId);
        if (equipment) {
          equipment.availabilityStatus = 'Available';
          saveEquipment(equipmentList);
        }
      }
    }

    // Payouts are deliberately released only after a verified paid booking completes.
    if (bookingStatus === 'Completed' && bk.paymentStatus === 'Paid' && bk.payoutStatus === 'Pending') {
      bk.payoutStatus = 'Processing';
      const payout = payouts.find(p => p.bookingId === bk.id) || { id: `PO-${Date.now()}`, bookingId: bk.id, providerId: bk.providerId, amount: bk.providerAmount || 0, currency: 'INR' as const, status: 'Processing' as const, requestedAt: new Date().toISOString() };
      payout.status = 'Processing'; payouts = [payout, ...payouts.filter(p => p.bookingId !== bk.id)]; bk.payoutId = payout.id;
      queueMySqlPersistence(persistFinancialRecords);
    }

    queueMySqlPersistence(persistBookings);
    res.json({ message: 'Booking status updated successfully', booking: bk });
  });

  // ==========================================
  // PAYMENT SERVICE BOUNDARY. Swap the mock adapter for Razorpay/another gateway here.
  // ==========================================

  app.post('/api/payments/create-order', (req: Request, res: Response) => {
    const booking = bookings.find(b => b.id === req.body.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const existing = payments.find(p => p.bookingId === booking.id && p.status === 'Pending');
    const orderId = existing?.gatewayOrderId || `order_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const payment = existing || { id: `PAY-${Date.now()}`, bookingId: booking.id, farmerId: booking.farmerId, providerId: booking.providerId, equipmentId: booking.equipmentId, amount: booking.totalAmount, currency: 'INR' as const, gateway: process.env.PAYMENT_GATEWAY || 'mock', gatewayOrderId: orderId, status: 'Pending' as const, createdAt: new Date().toISOString() };
    if (!existing) payments.unshift(payment);
    booking.paymentId = payment.id; booking.razorpayOrderId = orderId;
    queueMySqlPersistence(persistBookings); queueMySqlPersistence(persistFinancialRecords);
    res.json({
      id: orderId,
      entity: 'order',
      amount: payment.amount * 100, // paise
      currency: payment.currency,
      receipt: booking.bookingNumber,
      status: 'created'
    });
  });

  app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const payment = payments.find(p => p.gatewayOrderId === razorpay_order_id);
    if (!payment) return res.status(404).json({ error: 'Unknown payment order' });
    const booking = bookings.find(b => b.id === payment.bookingId)!;
    if (payment.status === 'Paid') return res.json({ success: true, booking, transactionId: payment.gatewayPaymentId });
    const secret = process.env.PAYMENT_GATEWAY_SECRET;
    const expected = secret ? createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex') : '';
    const validSignature = !!secret && !!razorpay_signature && expected.length === razorpay_signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
    // Test mode is explicit; production requires the provider signature/webhook verification.
    if (!validSignature && process.env.PAYMENT_GATEWAY !== 'mock' && process.env.NODE_ENV === 'production') return res.status(400).json({ error: 'Payment verification failed' });
    payment.status = 'Paid'; payment.gatewayPaymentId = razorpay_payment_id || `mock_pay_${Date.now()}`; payment.paidAt = new Date().toISOString();
    booking.paymentStatus = 'Paid'; booking.bookingStatus = 'Approved'; booking.razorpayPaymentId = payment.gatewayPaymentId;
    const equipment = equipmentList.find(e => e.id === booking.equipmentId); if (equipment) { equipment.availabilityStatus = 'Booked'; saveEquipment(equipmentList); }
    queueMySqlPersistence(persistBookings); queueMySqlPersistence(persistFinancialRecords);
    res.json({
      success: true,
      message: 'Payment verified server-side', booking,
      transactionId: payment.gatewayPaymentId
    });
  });

  app.post('/api/payments/webhook', (req: Request, res: Response) => {
    // Gateway adapters must verify their raw-body signature before calling the same settlement logic.
    const eventId = req.get('x-gateway-event-id');
    if (!eventId) return res.status(400).json({ error: 'Missing gateway event id' });
    res.status(202).json({ received: true, eventId }); // idempotency belongs in the gateway adapter/store.
  });

  app.get('/api/finance', (_req: Request, res: Response) => res.json({ payments, payouts, settings: paymentSettings }));
  app.put('/api/finance/settings', (req: Request, res: Response) => {
    if (req.get('x-user-role') !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const percent = Number(req.body.commissionPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return res.status(400).json({ error: 'Commission must be between 0 and 100' });
    paymentSettings = { ...paymentSettings, commissionPercent: percent, payoutRelease: req.body.payoutRelease === 'settlement_period' ? 'settlement_period' : 'rental_completed' };
    queueMySqlPersistence(persistFinancialRecords); res.json(paymentSettings);
  });
  app.post('/api/payouts/:id/process', (req: Request, res: Response) => {
    if (req.get('x-user-role') !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const payout = payouts.find(p => p.id === req.params.id); if (!payout) return res.status(404).json({ error: 'Payout not found' });
    if (payout.status !== 'Processing') return res.status(409).json({ error: 'Payout is not eligible for processing' });
    payout.status = 'Paid'; payout.manual = true; payout.processedAt = new Date().toISOString(); payout.processedBy = req.body.adminId || 'admin'; payout.gatewayPayoutId = `manual_${Date.now()}`;
    const booking = bookings.find(b => b.id === payout.bookingId); if (booking) booking.payoutStatus = 'Paid';
    queueMySqlPersistence(persistBookings); queueMySqlPersistence(persistFinancialRecords); res.json(payout);
  });

  // ==========================================
  // KNOWLEDGE CENTER
  // ==========================================

  app.get('/api/knowledge', (req: Request, res: Response) => {
    res.json(knowledgeArticles);
  });

  app.get('/api/knowledge/live', async (req: Request, res: Response) => {
    const feed = await getAgricultureNews();
    const state = req.query.state === 'tamil-nadu' ? 'tamil-nadu' : undefined;
    const language = req.query.language === 'ta' ? 'ta' : req.query.language === 'en' ? 'en' : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const query = typeof req.query.q === 'string' ? req.query.q.toLowerCase() : '';
    const filtered = feed.news.filter((item) => (!state || item.state === state) && (!language || item.language === language) && (!category || category === 'All' || item.category === category) && (!query || `${item.title} ${item.summary} ${item.source} ${item.category}`.toLowerCase().includes(query)));
    res.json({ ...feed, news: filtered.slice(0, Math.min(Number(req.query.limit) || 12, 20)), refreshAfterSeconds: KNOWLEDGE_CACHE_MS / 1000 });
  });

  app.get('/api/news', async (req: Request, res: Response) => {
    const feed = await getAgricultureNews();
    const state = req.query.state === 'tamil-nadu' ? 'tamil-nadu' : undefined;
    const language = req.query.language === 'ta' ? 'ta' : req.query.language === 'en' ? 'en' : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const query = typeof req.query.q === 'string' ? req.query.q.toLowerCase() : '';
    const news = feed.news.filter((item) => (!state || item.state === state) && (!language || item.language === language) && (!category || category === 'All' || item.category === category) && (!query || `${item.title} ${item.summary} ${item.source} ${item.category}`.toLowerCase().includes(query)));
    res.json({ ...feed, news: news.slice(0, Math.min(Number(req.query.limit) || 12, 20)) });
  });

  app.get('/api/schemes', (req: Request, res: Response) => {
    const state = req.query.state === 'tamil-nadu' ? 'tamil-nadu' : req.query.state === 'india' ? 'india' : undefined;
    res.json(officialSchemes.filter((scheme) => !state || scheme.state === state));
  });
  app.get('/api/schemes/:id', (req: Request, res: Response) => {
    const scheme = officialSchemes.find((item) => item.id === req.params.id);
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
    res.json(scheme);
  });
  app.get('/api/market-prices', (req: Request, res: Response) => {
    res.json({ prices: [], fetchedAt: null, available: false, message: 'Verified market-price data is not configured yet. No prices are shown rather than displaying unverified values.' });
  });
  app.get('/api/knowledge/last-updated', async (_req: Request, res: Response) => {
    const feed = await getAgricultureNews();
    res.json({ fetchedAt: feed.fetchedAt, fresh: feed.fresh, cached: feed.cached });
  });

  app.post('/api/knowledge', (req: Request, res: Response) => {
    const { title, category, summary, content, author, readTimeMinutes, thumbnail, tags } = req.body;
    const newArticle: KnowledgeArticle = {
      id: `art-${Date.now()}`,
      title,
      category: category || 'Government Scheme',
      summary,
      content,
      author: author || 'AgriEquip Admin',
      readTimeMinutes: Number(readTimeMinutes) || 5,
      thumbnail: thumbnail || '',
      tags: tags || ['Farming', 'Agriculture'],
      createdAt: new Date().toISOString().split('T')[0]
    };
    knowledgeArticles.unshift(newArticle);
    res.status(201).json(newArticle);
  });

  // ==========================================
  // WEATHER INFORMATION
  // ==========================================

  app.get('/api/weather', (req: Request, res: Response) => {
    res.json(MOCK_WEATHER);
  });

  // ==========================================
  // GEMINI AI SMART FARMING ADVISOR
  // ==========================================

  app.post('/api/ai/assistant', async (req: Request, res: Response) => {
    const { query, landSize, crop, location, history } = req.body;
    const question = typeof query === 'string' ? query.trim() : '';
    const conversationHistory: AdvisorMessage[] = Array.isArray(history) ? history : [];

    if (!question) return res.status(400).json({ error: 'Please enter a question for the AI advisor.' });
    if (question.length > 4000) return res.status(400).json({ error: 'Please keep your question under 4,000 characters.' });

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const rateLimit = aiRateLimits.get(clientIp);
    const currentRateLimit = !rateLimit || rateLimit.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : rateLimit;
    currentRateLimit.count += 1;
    aiRateLimits.set(clientIp, currentRateLimit);
    if (aiRateLimits.size > 10_000) {
      for (const [ip, entry] of aiRateLimits) if (entry.resetAt <= now) aiRateLimits.delete(ip);
    }
    if (currentRateLimit.count > AI_RATE_LIMIT_PER_MINUTE) {
      res.set('Retry-After', String(Math.ceil((currentRateLimit.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many AI requests. Please try again in a minute.' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ response: localAdvisorResponse(question, landSize, crop, location), mode: 'local-guidance' });
      }

      const cacheKey = JSON.stringify([question, landSize, crop, location, conversationHistory.slice(-8)]);
      const cached = aiResponseCache.get(cacheKey);
      if (cached && cached.expiresAt > now) return res.json({ response: cached.response, sources: cached.sources, mode: 'gemini-ai', cached: true });

      const answer = await aiRequestQueue.run(async () => {
        return generateGeminiAnswer(apiKey, buildAdvisorPrompt(question, landSize, crop, location, conversationHistory));
      });

      if (aiResponseCache.size >= 1_000) aiResponseCache.delete(aiResponseCache.keys().next().value!);
      aiResponseCache.set(cacheKey, { ...answer, expiresAt: now + 10 * 60_000 });
      return res.json({ ...answer, mode: 'gemini-ai' });
    } catch (err) {
      if (err instanceof Error && err.message === 'AI_QUEUE_FULL') {
        return res.status(503).json({ error: 'The AI advisor is busy. Please try again shortly.' });
      }
      const status = typeof err === 'object' && err && 'status' in err ? Number(err.status) : 0;
      if (status === 429) {
        return res.status(429).json({ error: 'Live web research is temporarily unavailable because the Gemini project quota has been reached. Check your Gemini billing and quota, then try again.' });
      }
      console.error('Gemini AI error:', err);
      return res.json({ response: localAdvisorResponse(question, landSize, crop, location), mode: 'local-guidance' });
    }
  });

  // ==========================================
  // ADMIN ANALYTICS & COMPLAINTS
  // ==========================================

  app.get('/api/admin/analytics', (req: Request, res: Response) => {
    const totalRevenue = bookings
      .filter(isPaidBooking)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const platformProfit = bookings
      .filter(isPaidBooking)
      .reduce((sum, b) => sum + calculatePlatformProfit(b), 0);

    const activeFarmers = users.filter((u) => u.role === 'farmer').length;
    const verifiedProviders = users.filter((u) => u.role === 'provider' && u.isVerified && u.status === 'active').length;
    const totalEquipment = equipmentList.length;
    const totalBookings = bookings.length;

    res.json({
      totalRevenue,
      platformProfit,
      activeFarmers,
      verifiedProviders,
      totalEquipment,
      totalBookings,
      pendingApprovals: users.filter((u) => u.role === 'provider' && u.status === 'pending_approval').length,
      equipmentByCategory: categories.map((cat) => ({
        category: cat.name,
        count: equipmentList.filter((e) => e.categoryId === cat.id).length
      }))
    });
  });

  app.get('/api/admin/complaints', (req: Request, res: Response) => {
    res.json(supportComplaints);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1h', etag: true }));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriEquip Connect Server running on http://localhost:${PORT}`);
  });
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.requestTimeout = 30_000;
}

initialiseMySql().finally(() => {
  ensureDefaultAdmin();
  startServer();
});
