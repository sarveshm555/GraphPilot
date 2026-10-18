import { GroundedAnswer, OverviewMetrics, Finding } from '../types';

const API_BASE = '/api';

export async function fetchOverview(): Promise<OverviewMetrics> {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) throw new Error('Failed to fetch overview metrics');
  return res.json();
}

export async function sendChatMessage(question: string, sessionId: string = 'default-session'): Promise<GroundedAnswer> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, session_id: sessionId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'API Error' }));
    throw new Error(err.detail || 'Failed to process question');
  }
  return res.json();
}

export async function fetchGraph(limit: number = 80) {
  const res = await fetch(`${API_BASE}/graph?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch graph');
  return res.json();
}

export async function fetchEntityDetail(entityId: string) {
  const res = await fetch(`${API_BASE}/graph/entities/${encodeURIComponent(entityId)}`);
  if (!res.ok) throw new Error('Entity not found');
  return res.json();
}

export async function fetchMemories(): Promise<Finding[]> {
  const res = await fetch(`${API_BASE}/memory`);
  if (!res.ok) throw new Error('Failed to fetch memory');
  return res.json();
}

export async function confirmMemory(text: string, targetEntityId?: string): Promise<Finding> {
  const res = await fetch(`${API_BASE}/memory/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_entity_id: targetEntityId })
  });
  if (!res.ok) throw new Error('Failed to confirm memory');
  return res.json();
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json();
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function fetchBlastRadius(systemId: string, maxDepth: number = 3): Promise<import('../types').BlastRadiusResult> {
  const res = await fetch(`${API_BASE}/blast-radius?system_id=${encodeURIComponent(systemId)}&max_depth=${maxDepth}`);
  if (!res.ok) throw new Error('Failed to fetch blast radius analysis');
  return res.json();
}

export async function searchEntities(query: string = '', label?: string): Promise<import('../types').EntitySearchResult[]> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (label && label !== 'All') params.append('label', label);
  const res = await fetch(`${API_BASE}/entities/search?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to search entities');
  return res.json();
}

export async function verifyMemory(findingId: string) {
  const res = await fetch(`${API_BASE}/memory/${encodeURIComponent(findingId)}/verify`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to verify memory finding');
  return res.json();
}

export async function supersedeMemory(findingId: string, replacementText?: string) {
  const res = await fetch(`${API_BASE}/memory/${encodeURIComponent(findingId)}/supersede`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replacement_text: replacementText })
  });
  if (!res.ok) throw new Error('Failed to supersede memory finding');
  return res.json();
}

export async function testLlmConnection(): Promise<{
  provider: string;
  model?: string;
  status: string;
  message: string;
  error_type?: string;
}> {
  const res = await fetch(`${API_BASE}/llm/test`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to test LLM connection' }));
    throw new Error(err.detail || 'Failed to test LLM connection');
  }
  return res.json();
}

