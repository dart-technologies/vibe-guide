#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('Missing EXPO_PUBLIC_ELEVENLABS_API_KEY (or ELEVENLABS_API_KEY) in .env');
  process.exit(1);
}

const projectRoot = path.join(__dirname, '..');
const outDir = path.join(projectRoot, 'assets', 'greetings');

const personas = [
  { id: 'ava', voiceId: 'XfNU2rGpBa01ckF309OY', stability: 0.7, similarity: 0.8, style: 0.6, text: "I'm thinking of something perfect..." },
  { id: 'barry', voiceId: 'CwhRBWXzGAHq8TQ4Fs17', stability: 0.6, similarity: 0.75, style: 0.85, text: 'Oh, this is going to be GOOD...' },
  { id: 'bella', voiceId: 'EXAVITQu4vr4xnSDxMaL', stability: 0.75, similarity: 0.8, style: 0.5, text: 'Let me find a quiet corner for you...' },
  { id: 'francesca', voiceId: 'MWUpoNpAY0rOQGP294mF', stability: 0.7, similarity: 0.8, style: 0.5, text: 'Hmm, let me think about this, darling...' },
  { id: 'lauren', voiceId: 'FGY2WhTYpPnrIDTdsKH5', stability: 0.65, similarity: 0.75, style: 0.65, text: 'Allow me a moment to curate this...' },
  { id: 'maxine', voiceId: 'Fc5CaIGWKvLHapoOSM2K', stability: 0.65, similarity: 0.75, style: 0.8, text: "Alright, let's crush this..." },
  { id: 'nora', voiceId: 'XfNU2rGpBa01ckF309OY', stability: 0.65, similarity: 0.8, style: 0.8, text: 'Ooh, I know just the spot...' },
  { id: 'pete', voiceId: 'N2lVS1w4EtoT3dr4eOWO', stability: 0.7, similarity: 0.8, style: 0.75, text: "Alright, listen up, I got the perfect plan..." },
  { id: 'sam', voiceId: 'CwhRBWXzGAHq8TQ4Fs17', stability: 0.7, similarity: 0.75, style: 0.55, text: 'Okay, okay, I got you...' },
  { id: 'willa', voiceId: 'EXAVITQu4vr4xnSDxMaL', stability: 0.75, similarity: 0.8, style: 0.5, text: 'Let me find something cozy for you...' },
];

async function ensureOutDir() {
  try {
    await fs.mkdir(outDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create output directory', err);
    process.exit(1);
  }
}

async function generateClip(persona) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${persona.voiceId}`;
  const body = {
    text: persona.text,
    voice_settings: {
      stability: persona.stability,
      similarity_boost: persona.similarity,
      style: persona.style,
    },
  };

  const res = await axios.post(url, body, {
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    responseType: 'arraybuffer',
  });

  const outputPath = path.join(outDir, `${persona.id}.mp3`);
  await fs.writeFile(outputPath, res.data, { encoding: 'binary' });
  return outputPath;
}

async function main() {
  await ensureOutDir();
  for (const persona of personas) {
    process.stdout.write(`Generating ${persona.id}... `);
    try {
      const file = await generateClip(persona);
      console.log(`done → ${path.relative(projectRoot, file)}`);
    } catch (err) {
      console.error(`failed: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
